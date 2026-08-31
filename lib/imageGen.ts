import { GoogleGenAI } from "@google/genai";
import { pruefeBildSicherheit } from "./imageSafety";

/**
 * Erzeugt live ein neues Ausmalbild-Motiv per Bild-KI (Google Gemini, Modell
 * "gemini-2.5-flash-image", auch bekannt als "Nano Banana"), wenn kein passendes Icon aus der
 * kuratierten Bibliothek (lib/icons.ts) existiert. Wird NUR für Motive aufgerufen, die laut
 * Systemprompt (lib/generateWorksheet.ts) ausschließlich Gegenstände, Tiere, Natur oder Gebäude
 * beschreiben dürfen - nie Personen. Drei unabhängige Sicherheitsebenen, jede für sich
 * ausreichend, zusammen aber deutlich robuster:
 * 1. Text-Blockliste (unten) - bricht schon vor dem API-Aufruf ab, wenn die Beschreibung selbst
 *    verräterische Begriffe enthält (Claude hat sich nicht an den Systemprompt gehalten).
 * 2. Explizite Verbots-Anweisung im Prompt an das Bildmodell selbst (Gemini kennt keinen
 *    separaten "negative_prompt"-Parameter wie SDXL, sondern nimmt Verbote als Teil der
 *    normalen Anweisung entgegen). HINWEIS: "imageConfig.personGeneration" gibt es zwar in der
 *    SDK-Typdefinition, wird von der kostenlosen Gemini Developer API (Google AI Studio) aber
 *    NICHT unterstützt (nur im Vertex-/Enterprise-Modus) - bewusst NICHT gesetzt, sonst schlägt
 *    JEDE Bildgenerierung mit einem Laufzeitfehler fehl.
 * 3. Claude-Bildprüfung NACH der Generierung (siehe lib/imageSafety.ts) - erkennt auch, was
 *    Ebene 1+2 nicht abfangen (das Bildmodell hält sich nicht an die Anweisung).
 *
 * Bewusst über die Gemini API (Google AI Studio) statt Replicate: das kostenlose Kontingent
 * dort erfordert keine hinterlegte Zahlungsmethode/Kreditkarte, nur einen kostenlosen
 * API-Key (siehe README).
 */
const BILD_MODELL = "gemini-2.5-flash-image";

const STIL_PROMPT_PREFIX =
  "Simple black and white coloring book page for children, clean bold outlines only, no shading, no color, no text, no watermark, white background, single centered object.";

const VERBOTS_ANWEISUNG =
  "Do NOT depict any human, person, face, body part, silhouette of a person, prophet, deity, religious figure, or any text/letters/watermark. Do not add shading or color - outlines only.";

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
  // Namen der im Islam bekannten Propheten - falls Claude sich trotz Systemprompt auf die
  // Geschichte statt nur das Objekt bezieht (z.B. "der Fisch von Yunus").
  "yunus",
  "jonah",
  "musa",
  "moses",
  "isa",
  "jesus",
  "ibrahim",
  "abraham",
  "adam",
  "nuh",
  "noah",
  "yusuf",
  "josef",
  "joseph",
  "dawud",
  "david",
  "sulaiman",
  "salomo",
  "solomon",
  "idris",
  "ismail",
  "ishaq",
  "isaak",
  "yaqub",
  "jakob",
  "harun",
  "aaron",
  "hud",
  "salih",
  "lut",
  "lot",
  "shuayb",
  "ayyub",
  "hiob",
  "job",
  "yahya",
  "johannes",
  "zakariya",
  "zacharias",
  "ilyas",
  "elias",
  "alyasa",
  "elisa",
  "dhul-kifl",
];

/** Wortgrenzen-Abgleich statt reinem Teilstring-Vergleich, damit kurze Namen wie "lot" oder
 * "isa" nicht schon in harmlosen Wörtern wie "Lotus" oder "Praxis" anschlagen. */
function findeVerbotenenBegriff(text: string): string | null {
  const lower = text.toLowerCase();
  return (
    VERBOTENE_BEGRIFFE.find((begriff) => new RegExp(`(?<![\\p{L}])${begriff}(?![\\p{L}])`, "u").test(lower)) ?? null
  );
}

let client: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY ist nicht gesetzt.");
    }
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

/** Generiert ein einzelnes Ausmalbild-Motiv und gibt die PNG-Bilddaten zurück.
 * `zusaetzlicheVerbote` verschärft die Verbots-Anweisung gezielt (z.B. nach einem
 * fehlgeschlagenen Sicherheits-Check, siehe beschaffeSicheresAusmalbild). */
export async function generiereAusmalbild(
  motivBeschreibung: string,
  zusaetzlicheVerbote?: string,
): Promise<Buffer> {
  const ai = getGeminiClient();

  const verbotsAnweisung = zusaetzlicheVerbote
    ? `${VERBOTS_ANWEISUNG} Also do not include: ${zusaetzlicheVerbote}.`
    : VERBOTS_ANWEISUNG;

  const response = await ai.models.generateContent({
    model: BILD_MODELL,
    contents: `${STIL_PROMPT_PREFIX} Motif: ${motivBeschreibung}. ${verbotsAnweisung}`,
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "1:1" },
    },
  });

  const teil = response.candidates?.[0]?.content?.parts?.find((p) =>
    p.inlineData?.mimeType?.startsWith("image/"),
  );
  if (!teil?.inlineData?.data) {
    throw new Error("Unerwartetes Antwortformat von Gemini (keine Bilddaten erhalten).");
  }
  return Buffer.from(teil.inlineData.data, "base64");
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

  let zusaetzlicheVerbote: string | undefined;

  for (let versuch = 1; versuch <= MAX_VERSUCHE; versuch++) {
    try {
      const bild = await generiereAusmalbild(motivBeschreibung, zusaetzlicheVerbote);
      const ergebnis = await pruefeBildSicherheit(bild);
      if (ergebnis.sicher) return bild;
      console.warn(
        `Generiertes Ausmalbild verworfen (Versuch ${versuch}/${MAX_VERSUCHE}) für Motiv "${motivBeschreibung}": ${ergebnis.grund}`,
      );
      zusaetzlicheVerbote = ergebnis.grund;
    } catch (err) {
      console.error(
        `Fehler bei der Bildgenerierung (Versuch ${versuch}/${MAX_VERSUCHE}) für Motiv "${motivBeschreibung}":`,
        err,
      );
    }
  }
  return null;
}
