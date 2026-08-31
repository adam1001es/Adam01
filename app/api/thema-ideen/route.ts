import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAnthropicClient, IDEEN_MODEL, extractJson, getTextFromMessage } from "@/lib/anthropic";
import { ThemaIdeenRequestSchema, ThemaIdeenAntwortSchema } from "@/lib/types";
import { THEMENBEREICHE, holeSchulstufenThemen } from "@/lib/curriculum";
import { getThemaIdeenStatus, incrementThemaIdeenUsage, THEMA_IDEEN_TAGESLIMIT } from "@/lib/themaIdeen";

/** Kurze, günstige Inspirations-Vorschläge für Lehrkräfte ohne eigene Thema-Idee - bewusst
 * NICHT das eigentliche Arbeitsblatt-Kontingent (lib/quota.ts), sondern ein separates,
 * tägliches Limit (siehe lib/themaIdeen.ts), da hier kein Arbeitsblatt entsteht. */
const IDEEN_SYSTEM_PROMPT = `Du bist eine kreative Fachdidaktikerin für den islamischen Religionsunterricht an österreichischen Schulen. Eine Lehrkraft sucht Inspiration für ein konkretes Unterrichtsthema und hat gerade keine eigene Idee.

Schlage GENAU 6 konkrete, kreative, aber lehrplankonforme und altersgerechte Themenideen vor. Jede Idee ist ein kurzer, prägnanter Thema-Text (max. ca. 8 Wörter), der sich direkt als "Thema" für ein Arbeitsblatt eintragen lässt - spezifischer und lebendiger als ein grober Lehrplan-Themenkreis (z.B. nicht nur "Der Monat Ramadan", sondern "Warum fastest du? – Ramadan aus Kindersicht"; nicht nur "Die Propheten", sondern "Der Wal, der Yunus rettete"). Die 6 Ideen sollen sich inhaltlich klar voneinander unterscheiden, nicht nur in der Formulierung variieren. Keine erfundenen Sure-/Hadith-Nummern in den Vorschlägen selbst.

Antworte NUR mit einem einzigen JSON-Objekt, ohne Markdown-Codeblock: { "ideen": string[] } - genau 6 Einträge.`;

function buildIdeenUserPrompt(schulstufe: string, bereichLabel: string, bereichBeschreibung: string): string {
  const schulstufenThemen = holeSchulstufenThemen(schulstufe);
  return `Schulstufe: ${schulstufe}
Grundkompetenz-Schwerpunkt: ${bereichLabel} - ${bereichBeschreibung}
${
  schulstufenThemen
    ? `Zur Orientierung, reale Lehrplan-Themenkreise für diese Schulstufe: ${schulstufenThemen.join(", ")}. Deine Ideen dürfen davon inspiriert sein, sollen aber konkreter/spezifischer sein als diese groben Kategorien, nicht einfach nur Kopien davon.`
    : ""
}`;
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = ThemaIdeenRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  const istAdmin = user.role === "admin";
  const status = istAdmin ? null : await getThemaIdeenStatus(user.id);
  if (status && status.verbleibend <= 0) {
    return NextResponse.json(
      { error: `Tageslimit für Themenideen erreicht (${THEMA_IDEEN_TAGESLIMIT}/Tag). Morgen wieder verfügbar.` },
      { status: 429 },
    );
  }

  const bereich = THEMENBEREICHE[parsed.data.themenbereich];

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: IDEEN_MODEL,
      max_tokens: 500,
      system: IDEEN_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildIdeenUserPrompt(parsed.data.schulstufe, bereich.label, bereich.beschreibung) },
      ],
    });

    const raw = extractJson(getTextFromMessage(response));
    const { ideen } = ThemaIdeenAntwortSchema.parse(raw);

    if (!istAdmin) await incrementThemaIdeenUsage(user.id);
    const verbleibend = istAdmin ? null : Math.max(0, (status?.verbleibend ?? THEMA_IDEEN_TAGESLIMIT) - 1);

    return NextResponse.json({ ideen, verbleibend });
  } catch (err) {
    console.error("Fehler bei der Themenideen-Generierung:", err);
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
