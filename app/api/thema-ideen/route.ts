import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAnthropicClient, IDEEN_MODEL, extractJson, getTextFromMessage } from "@/lib/anthropic";
import { ThemaIdeenRequestSchema, ThemaIdeenAntwortSchema } from "@/lib/types";
import { THEMENBEREICHE, holeSchulstufenThemen } from "@/lib/curriculum";
import { getThemaIdeenStatus, incrementThemaIdeenUsage, THEMA_IDEEN_TAGESLIMIT } from "@/lib/themaIdeen";
import { UsageEintrag, usageEintragAusAntwort, speichereUsage } from "@/lib/usageLog";

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

/** Ein einzelner Versuch, Ideen zu generieren und als JSON zu lesen - wirft bei jedem Fehlschlag
 * (Netzwerk, Abschneiden durch max_tokens, kein valides JSON in der Antwort). Wird von der Route
 * bis zu zweimal aufgerufen (siehe unten): bei einem so kurzen, günstigen Aufruf ist ein
 * automatischer zweiter Versuch fast kostenlos und macht die Funktion für die Lehrkraft
 * spürbar zuverlässiger, statt bei einem einmaligen Ausrutscher sofort eine rohe Fehlermeldung
 * zu zeigen. */
async function versucheIdeenGenerierung(userPrompt: string, usageAkku: UsageEintrag[]): Promise<string[]> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: IDEEN_MODEL,
    // claude-sonnet-5 denkt standardmäßig (adaptive thinking), auch ohne "thinking"-Parameter -
    // die Denk-Tokens zählen dabei gegen max_tokens. Ohne effort-Begrenzung konnte das variable
    // Denken bei dieser eigentlich trivialen Aufgabe (6 kurze Themenideen) gelegentlich den
    // gesamten Token-Rahmen aufbrauchen, bevor überhaupt sichtbarer JSON-Text geschrieben wurde -
    // das war die eigentliche Ursache für die abgeschnittenen Antworten, nicht ein zu niedriges
    // max_tokens allein. effort "low" hält das Denken für diese einfache Aufgabe knapp.
    output_config: { effort: "low" },
    max_tokens: 2048,
    system: IDEEN_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  // Direkt nach Erhalt der Antwort erfassen, VOR jeder weiteren Verarbeitung, die noch werfen
  // kann (max_tokens/JSON-Parse-Fehler unten) - der Aufruf selbst hat so oder so schon echtes
  // Geld gekostet, das war vorher komplett unerfasst (siehe lib/usageLog.ts, Phase "ideen").
  usageAkku.push(usageEintragAusAntwort(IDEEN_MODEL, "ideen", response.usage));

  if (response.stop_reason === "max_tokens") {
    throw new Error("Die Antwort wurde abgeschnitten.");
  }

  const rawText = getTextFromMessage(response);
  try {
    const raw = extractJson(rawText);
    const { ideen } = ThemaIdeenAntwortSchema.parse(raw);
    return ideen;
  } catch (err) {
    // rawText mitloggen, sonst lässt sich ein Parse-Fehler in Produktion nicht nachvollziehen -
    // "Keine JSON-Struktur gefunden" allein sagt nicht, was die KI stattdessen geschrieben hat.
    console.error("Themenideen-Antwort konnte nicht gelesen werden. Rohtext:", rawText);
    throw err;
  }
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
  const userPrompt = buildIdeenUserPrompt(parsed.data.schulstufe, bereich.label, bereich.beschreibung);

  let ideen: string[] | null = null;
  let letzterFehler: unknown = null;
  const usage: UsageEintrag[] = [];
  for (let versuch = 1; versuch <= 2 && !ideen; versuch++) {
    try {
      ideen = await versucheIdeenGenerierung(userPrompt, usage);
    } catch (err) {
      letzterFehler = err;
    }
  }
  // Auch bei einem letztlich fehlgeschlagenen Versuch: jeder tatsächlich ausgeführte Aufruf hat
  // schon echtes Geld gekostet (siehe Kommentar in versucheIdeenGenerierung oben).
  await speichereUsage(usage, user.id, null);

  if (!ideen) {
    console.error("Themenideen-Generierung nach zwei Versuchen fehlgeschlagen:", letzterFehler);
    return NextResponse.json(
      { error: "Ideen konnten gerade nicht erstellt werden. Bitte nochmal versuchen." },
      { status: 502 },
    );
  }

  if (!istAdmin) await incrementThemaIdeenUsage(user.id);
  const verbleibend = istAdmin ? null : Math.max(0, (status?.verbleibend ?? THEMA_IDEEN_TAGESLIMIT) - 1);

  return NextResponse.json({ ideen, verbleibend });
}
