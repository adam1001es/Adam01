import Replicate from "replicate";
import { pruefeBildSicherheit } from "./imageSafety";

/**
 * Erzeugt live ein neues Ausmalbild-Motiv per Bild-KI (Replicate/SDXL), wenn kein passendes
 * Icon aus der kuratierten Bibliothek (lib/icons.ts) existiert. Wird NUR für Motive
 * aufgerufen, die laut Systemprompt (lib/generateWorksheet.ts) ausschließlich Gegenstände,
 * Tiere, Natur oder Gebäude beschreiben dürfen - nie Personen. Das allein reicht aber nicht:
 * das Ergebnis wird danach zusätzlich per Claude-Bildprüfung kontrolliert (siehe
 * lib/imageSafety.ts) und bei jedem Verdacht auf Personen/religiöse Symbole verworfen.
 *
 * Modell-Version ist ein Verweis auf einen zum Zeitpunkt der Implementierung öffentlich
 * bekannten, langlebigen SDXL-Stand auf Replicate - kann sich ändern. Falls der Aufruf mit
 * "version does not exist" fehlschlägt: aktuelle Version auf replicate.com/stability-ai/sdxl
 * nachschlagen und hier eintragen.
 */
const SDXL_MODELL =
  "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08";

const STIL_PROMPT_PREFIX =
  "simple black and white coloring book page for children, clean bold outlines only, no shading, no color, no text, no watermark, white background, single centered object";

const NEGATIV_PROMPT =
  "human, person, people, face, faces, portrait, man, woman, boy, girl, child, children, silhouette of a person, prophet, muhammad, allah, god, deity, religious figure, hands, body, text, letters, watermark, signature, color, shading, realistic, photo, photorealistic";

let client: Replicate | null = null;

function getReplicateClient(): Replicate {
  if (!client) {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN ist nicht gesetzt.");
    }
    client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN, useFileOutput: false });
  }
  return client;
}

/** Generiert ein einzelnes Ausmalbild-Motiv und gibt die PNG-Bilddaten zurück. */
export async function generiereAusmalbild(motivBeschreibung: string): Promise<Buffer> {
  const replicate = getReplicateClient();

  const output = await replicate.run(SDXL_MODELL, {
    input: {
      prompt: `${STIL_PROMPT_PREFIX}, ${motivBeschreibung}`,
      negative_prompt: NEGATIV_PROMPT,
      width: 768,
      height: 768,
      num_outputs: 1,
      num_inference_steps: 30,
    },
  });

  const url = Array.isArray(output) ? output[0] : output;
  if (typeof url !== "string") {
    throw new Error("Unerwartetes Antwortformat von Replicate (keine Bild-URL erhalten).");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Generiertes Bild konnte nicht heruntergeladen werden (Status ${response.status}).`);
  }
  return Buffer.from(await response.arrayBuffer());
}

const MAX_VERSUCHE = 2;

/**
 * Generiert ein Ausmalbild und lässt es von Claude gegenprüfen (siehe lib/imageSafety.ts).
 * Bei Verdacht auf Personen/religiöse Symbole wird einmal neu generiert; bleibt es auch beim
 * zweiten Versuch auffällig oder schlägt die Generierung technisch fehl, wird `null`
 * zurückgegeben - der Aufrufer muss dann auf ein festes Icon aus der kuratierten Bibliothek
 * zurückfallen. Es wird NIE ein ungeprüftes Bild zurückgegeben.
 */
export async function beschaffeSicheresAusmalbild(motivBeschreibung: string): Promise<Buffer | null> {
  for (let versuch = 1; versuch <= MAX_VERSUCHE; versuch++) {
    try {
      const bild = await generiereAusmalbild(motivBeschreibung);
      const ergebnis = await pruefeBildSicherheit(bild);
      if (ergebnis.sicher) return bild;
      console.warn(
        `Generiertes Ausmalbild verworfen (Versuch ${versuch}/${MAX_VERSUCHE}) für Motiv "${motivBeschreibung}": ${ergebnis.grund}`,
      );
    } catch (err) {
      console.error(
        `Fehler bei der Bildgenerierung (Versuch ${versuch}/${MAX_VERSUCHE}) für Motiv "${motivBeschreibung}":`,
        err,
      );
    }
  }
  return null;
}
