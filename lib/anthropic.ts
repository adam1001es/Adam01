import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export const GENERATION_MODEL = "claude-opus-5";
// Die Prüfung ist eine Gegenkontrolle des bereits von Opus generierten Inhalts, kein
// Kernstück der Qualität - ein günstigeres Modell senkt die Kosten hier um ca. 60%, ohne dass
// die eigentliche Arbeitsblatt-Qualität (die hängt an GENERATION_MODEL) darunter leidet.
export const VERIFICATION_MODEL = "claude-sonnet-5";
// Kurze, günstige Themenideen-Vorschläge (siehe app/api/thema-ideen) sind kein Kernstück der
// Arbeitsblatt-Qualität - dieselbe Kostenlogik wie bei VERIFICATION_MODEL, eigener Name für
// bessere Lesbarkeit an den Aufrufstellen und falls die Modelle künftig auseinanderlaufen sollen.
export const IDEEN_MODEL = "claude-sonnet-5";

/** Extrahiert das erste { ... } JSON-Objekt aus einer Modellantwort, auch wenn Fließtext drumherum steht. */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Keine JSON-Struktur in der Modellantwort gefunden.");
  }
  const jsonSlice = text.slice(start, end + 1);
  return JSON.parse(jsonSlice);
}

export function getTextFromMessage(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
