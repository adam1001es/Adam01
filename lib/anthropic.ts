import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

// Modell-ID-Konstanten liegen in lib/models.ts (kein SDK-Import dort) und werden hier nur
// re-exportiert, damit bestehende "from '@/lib/anthropic'"-Importe unverändert weiterfunktionieren
// - siehe Kommentar in lib/models.ts für den Grund (Client-Bundle-Sicherheit von lib/pricing.ts).
export {
  GENERATION_MODEL,
  VERIFICATION_MODEL,
  IDEEN_MODEL,
  PRUEFUNG_ZUSAMMENSTELLEN_MODEL,
} from "@/lib/models";

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
