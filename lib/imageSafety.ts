import { getAnthropicClient, GENERATION_MODEL, extractJson, getTextFromMessage } from "./anthropic";

/**
 * Zweite, unabhängige Prüfung für live per Bild-KI generierte Ausmalbilder (siehe
 * lib/imageGen.ts): der Erzeugungs-Prompt verbietet Personen/religiöse Figuren bereits, aber
 * ein Bildmodell kann sich trotzdem nicht daran halten. Deshalb sieht sich Claude jedes
 * generierte Bild direkt an, bevor es in einem Arbeitsblatt landet.
 */

const SICHERHEITS_PROMPT = `Du prüfst ein automatisch generiertes Ausmalbild, das in einem Arbeitsblatt für den islamischen Religionsunterricht an österreichischen Schulen verwendet werden soll (Zielgruppe: Kinder der 1./2. Klasse Volksschule).

Prüfe ausschließlich zwei Dinge:
1. Enthält das Bild irgendeine Person, ein Gesicht, eine menschliche Silhouette oder Körperteile (auch nur angedeutet, stilisiert oder im Hintergrund)?
2. Enthält das Bild ein Symbol, eine Schrift oder ein Motiv, das als Darstellung Allahs, eines Propheten oder als (auch nur ähnlich aussehender) Koran-Text gelesen werden könnte?

Sei im Zweifel streng: bei jeder Unsicherheit "ja" ankreuzen.

Antworte NUR mit einem einzigen JSON-Objekt, ohne Markdown-Codeblock:
{ "enthaeltPersonen": boolean, "enthaeltReligioeseSymbole": boolean, "grund": string }`;

export interface BildSicherheitsErgebnis {
  sicher: boolean;
  grund: string;
}

export async function pruefeBildSicherheit(bildPng: Buffer): Promise<BildSicherheitsErgebnis> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: bildPng.toString("base64") },
          },
          { type: "text", text: SICHERHEITS_PROMPT },
        ],
      },
    ],
  });

  const raw = extractJson(getTextFromMessage(response)) as {
    enthaeltPersonen?: boolean;
    enthaeltReligioeseSymbole?: boolean;
    grund?: string;
  };

  const sicher = raw.enthaeltPersonen !== true && raw.enthaeltReligioeseSymbole !== true;
  return { sicher, grund: raw.grund ?? "" };
}
