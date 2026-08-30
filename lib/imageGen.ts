import Replicate from "replicate";
import { pruefeBildSicherheit } from "./imageSafety";

/**
 * Erzeugt live ein neues Ausmalbild-Motiv per Bild-KI (Replicate/SDXL), wenn kein passendes
 * Icon aus der kuratierten Bibliothek (lib/icons.ts) existiert. Wird NUR für Motive
 * aufgerufen, die laut Systemprompt (lib/generateWorksheet.ts) ausschließlich Gegenstände,
 * Tiere, Natur oder Gebäude beschreiben dürfen - nie Personen. Drei unabhängige
 * Sicherheitsebenen, jede für sich ausreichend, zusammen aber deutlich robuster:
 * 1. Text-Blockliste (unten) - bricht schon vor dem teuren API-Aufruf ab, wenn die
 *    Beschreibung selbst verräterische Begriffe enthält (Claude hat sich nicht an den
 *    Systemprompt gehalten).
 * 2. Fester Negativ-Prompt an das Bildmodell selbst.
 * 3. Claude-Bildprüfung NACH der Generierung (siehe lib/imageSafety.ts) - erkennt auch, was
 *    Ebene 1+2 nicht abfangen (das Bildmodell hält sich nicht an den Negativ-Prompt).
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

/**
 * Ebene 1: bricht schon VOR dem API-Aufruf ab, wenn Claude sich nicht an den Systemprompt
 * gehalten und trotzdem einen verräterischen Begriff in die Beschreibung geschrieben hat -
 * spart einen unnötigen (kostenpflichtigen) Generierungsversuch, der ohnehin verworfen würde.
 * Bewusst NUR als Blockade, nie als "Begriff entfernen und trotzdem generieren": eine
 * Beschreibung, die z.B. "Prophet" enthält, wird komplett verworfen statt "repariert" - schon
 * eine bloß gesichtslose Figur des Propheten wäre weiterhin heikel, das Problem ist die
 * figürliche Darstellung selbst, nicht nur das Gesicht.
 */
const VERBOTENE_BEGRIFFE = [
  "prophet",
  "muhammad",
  "mohammed",
  "mohammad",
  "gesandte",
  "allah",
  "gott",
  "koran",
  "quran",
  "mensch",
  "person",
  "gesicht",
  "frau",
  "mann",
  "kind",
  "junge",
  "mädchen",
  "figur",
  "silhouette",
  "körper",
];

function findeVerbotenenBegriff(text: string): string | null {
  const lower = text.toLowerCase();
  return VERBOTENE_BEGRIFFE.find((begriff) => lower.includes(begriff)) ?? null;
}

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

/** Generiert ein einzelnes Ausmalbild-Motiv und gibt die PNG-Bilddaten zurück.
 * `zusaetzlicheNegativBegriffe` verschärft den Negativ-Prompt gezielt (z.B. nach einem
 * fehlgeschlagenen Sicherheits-Check, siehe beschaffeSicheresAusmalbild). */
export async function generiereAusmalbild(
  motivBeschreibung: string,
  zusaetzlicheNegativBegriffe?: string,
): Promise<Buffer> {
  const replicate = getReplicateClient();

  const negativPrompt = zusaetzlicheNegativBegriffe
    ? `${NEGATIV_PROMPT}, ${zusaetzlicheNegativBegriffe}`
    : NEGATIV_PROMPT;

  const output = await replicate.run(SDXL_MODELL, {
    input: {
      prompt: `${STIL_PROMPT_PREFIX}, ${motivBeschreibung}`,
      negative_prompt: negativPrompt,
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
 * Bei Verdacht auf Personen/religiöse Symbole wird einmal neu generiert - diesmal mit dem
 * konkreten Grund des ersten Fehlschlags als zusätzlichem Negativ-Begriff, damit der zweite
 * Versuch gezielt genau das vermeidet, was beim ersten schiefging (statt blind mit
 * unverändertem Prompt neu zu würfeln). Bleibt es auch beim zweiten Versuch auffällig, schlägt
 * die Beschreibung selbst schon die Text-Blockliste an, oder schlägt die Generierung technisch
 * fehl, wird `null` zurückgegeben - der Aufrufer muss dann auf ein festes Icon aus der
 * kuratierten Bibliothek zurückfallen. Es wird NIE ein ungeprüftes Bild zurückgegeben.
 */
export async function beschaffeSicheresAusmalbild(motivBeschreibung: string): Promise<Buffer | null> {
  const verbotenerBegriff = findeVerbotenenBegriff(motivBeschreibung);
  if (verbotenerBegriff) {
    console.warn(
      `Motiv-Beschreibung "${motivBeschreibung}" enthält verbotenen Begriff "${verbotenerBegriff}" - Generierung wird gar nicht erst versucht.`,
    );
    return null;
  }

  let zusaetzlicheNegativBegriffe: string | undefined;

  for (let versuch = 1; versuch <= MAX_VERSUCHE; versuch++) {
    try {
      const bild = await generiereAusmalbild(motivBeschreibung, zusaetzlicheNegativBegriffe);
      const ergebnis = await pruefeBildSicherheit(bild);
      if (ergebnis.sicher) return bild;
      console.warn(
        `Generiertes Ausmalbild verworfen (Versuch ${versuch}/${MAX_VERSUCHE}) für Motiv "${motivBeschreibung}": ${ergebnis.grund}`,
      );
      zusaetzlicheNegativBegriffe = ergebnis.grund;
    } catch (err) {
      console.error(
        `Fehler bei der Bildgenerierung (Versuch ${versuch}/${MAX_VERSUCHE}) für Motiv "${motivBeschreibung}":`,
        err,
      );
    }
  }
  return null;
}
