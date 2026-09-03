import { prisma } from "./prisma";
import { getAnthropicClient, GENERATION_MODEL, extractJson, getTextFromMessage } from "./anthropic";
import {
  Aufgabe,
  AufgabeErgaenzenAntwortSchema,
  AufgabeErgaenzenRequest,
  WorksheetContent,
  KOMPLEXITAET_LABEL,
} from "./types";
import { buildCurriculumSystemContext, guessSchulstufenCluster, ANFORDERUNGSBEREICHE, ThemenbereichKey } from "./curriculum";
import { buildWissensbasisSystemContext } from "./wissensbasis";
import { vereinfacheArabischeTransliteration } from "./transliteration";
import { GENERATION_SYSTEM_PROMPT_BASE } from "./generateWorksheet";
import { UsageEintrag, usageEintragAusAntwort } from "./usageLog";

/** Tägliches (nicht monatliches) Limit für "Aufgabe von KI erstellen" auf der Bearbeiten-Seite
 * (siehe app/api/worksheet/[id]/aufgabe-generieren/route.ts) - analog zu
 * THEMA_IDEEN_TAGESLIMIT (lib/themaIdeen.ts), aber deutlich großzügiger: das ist Teil des
 * eigentlichen Bearbeitungs-Workflows (eine Lehrkraft probiert bei einer Aufgabe realistisch
 * mehrmals hintereinander eine passende Formulierung/Typ-Kombination aus), kein spontanes
 * Extra-Hilfsmittel. Admin-Konten sind ausgenommen (siehe Route), analog zum unbegrenzten
 * Arbeitsblatt-Kontingent. */
export const AUFGABE_ERGAENZEN_TAGESLIMIT = 20;

function heutigerTag(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export interface AufgabeErgaenzenStatus {
  verbraucht: number;
  limit: number;
  verbleibend: number;
}

export async function getAufgabeErgaenzenStatus(userId: string): Promise<AufgabeErgaenzenStatus> {
  const eintrag = await prisma.aufgabeErgaenzenUsage.findUnique({
    where: { userId_tag: { userId, tag: heutigerTag() } },
  });
  const verbraucht = eintrag?.anzahl ?? 0;
  return {
    verbraucht,
    limit: AUFGABE_ERGAENZEN_TAGESLIMIT,
    verbleibend: Math.max(0, AUFGABE_ERGAENZEN_TAGESLIMIT - verbraucht),
  };
}

export async function incrementAufgabeErgaenzenUsage(userId: string): Promise<void> {
  const tag = heutigerTag();
  await prisma.aufgabeErgaenzenUsage.upsert({
    where: { userId_tag: { userId, tag } },
    create: { userId, tag, anzahl: 1 },
    update: { anzahl: { increment: 1 } },
  });
}

/** Zusätzlicher System-Textblock NUR für diese Funktion (siehe GENERATION_SYSTEM_PROMPT_BASE,
 * das für ein VOLLSTÄNDIGES Arbeitsblatt formuliert ist) - überschreibt die dortige
 * Ziel-JSON-Struktur auf genau eine einzelne Aufgabe samt Lösung, alle übrigen Typformat-/
 * Qualitätsregeln (pro Aufgabentyp, Transliteration, Terminologie, ...) bleiben unverändert
 * gültig und werden hier NICHT wiederholt. */
const AUFGABE_ERGAENZEN_SYSTEM_ZUSATZ = `WICHTIGER ZUSATZ: Hier geht es NICHT um ein neues, vollständiges Arbeitsblatt, sondern um GENAU EINE zusätzliche Aufgabe, die eine Lehrkraft nachträglich zu einem bereits fertigen, bestehenden Arbeitsblatt hinzufügen möchte. Halte dich an alle obigen Regeln für den vorgegebenen Aufgabentyp (Pflichtfelder, Qualitätsanspruch, Transliteration, Terminologie), aber antworte NUR mit dieser Struktur, ohne umschließendes Arbeitsblatt-Objekt:
{ "aufgabe": { "typ": "...", "frage": string, ... die typ-spezifischen Felder wie oben beschrieben ..., "anforderungsbereich": "afb1"|"afb2"|"afb3" }, "loesung": string }
Setze in "aufgabe" KEIN Feld "nr" - die Nummerierung wird serverseitig vergeben. Die neue Aufgabe MUSS inhaltlich zum Thema/Lernziel des bestehenden Arbeitsblatts passen UND sich klar von den bereits vorhandenen Aufgaben unterscheiden (kein Duplikat, keine bloße Umformulierung einer schon vorhandenen Aufgabe).`;

function buildAufgabeErgaenzenUserPrompt(content: WorksheetContent, req: AufgabeErgaenzenRequest): string {
  const bestehendeAufgaben =
    content.aufgaben.length > 0
      ? content.aufgaben.map((a, i) => `${i + 1}. [${a.typ}] ${a.frage}`).join("\n")
      : "(noch keine Aufgaben)";

  return `Bestehendes Arbeitsblatt, zu dem eine zusätzliche Aufgabe passen muss:
- Thema: ${content.thema}
- Lernziel: ${content.lernziel}
- Schulstufe: ${content.schulstufe}

Bereits vorhandene Aufgaben (die neue Aufgabe darf diese NICHT wiederholen):
${bestehendeAufgaben}

Erstelle GENAU EINE zusätzliche Aufgabe:
- Aufgabentyp: ${req.aufgabentyp}
- Komplexität: ${KOMPLEXITAET_LABEL[req.komplexitaet]}
${req.anforderungsbereich ? `- Gewünschter Anforderungsbereich: ${req.anforderungsbereich} (${ANFORDERUNGSBEREICHE[req.anforderungsbereich].label})` : ""}
${req.vorgabe ? `- Zusätzlicher Wunsch der Lehrkraft für diese Aufgabe: ${req.vorgabe}` : ""}`;
}

/**
 * Generiert EINE zusätzliche Aufgabe (samt Lösung) passend zu einem bereits bestehenden
 * Arbeitsblatt - für "Aufgabe von KI erstellen" auf der Bearbeiten-Seite. Bewusst EIN einzelner
 * Claude-Aufruf OHNE separate Verifikations-Stufe (im Unterschied zu
 * generateAndVerifyWorksheet/generiereUndPruefeEinmal in lib/generateWorksheet.ts): die
 * Lehrkraft sieht das Ergebnis direkt im Bearbeiten-Formular und kann es vor dem Speichern selbst
 * noch anpassen oder wieder entfernen, ein zweiter (kostenpflichtiger) Prüf-Aufruf wäre hier
 * unverhältnismäßig - die inhaltlichen Sicherheitsregeln aus GENERATION_SYSTEM_PROMPT_BASE
 * (keine erfundenen Sure-/Hadith-Stellen, Terminologie, Transliteration) gelten trotzdem
 * unverändert für diesen Aufruf.
 */
export async function generiereZusaetzlicheAufgabe(
  content: WorksheetContent,
  themenbereich: ThemenbereichKey,
  req: AufgabeErgaenzenRequest,
): Promise<{ aufgabe: Aufgabe; loesung: string; usage: UsageEintrag[] }> {
  const curriculumContext = buildCurriculumSystemContext(themenbereich, content.schulstufe, req.komplexitaet);
  const wissensbasisContext = await buildWissensbasisSystemContext(
    themenbereich,
    guessSchulstufenCluster(content.schulstufe).id,
  );

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: GENERATION_MODEL,
    // Deutlich niedriger als bei einer vollen Arbeitsblatt-Generierung (dort 24000): hier
    // entsteht nur EINE einzelne Aufgabe samt Lösung, nie ein Kreuzworträtsel-/Wortsuche-Gitter
    // (die sind ohnehin nicht Teil von AUFGABEN_TYPEN_AKTIV, siehe AufgabeErgaenzenRequestSchema).
    max_tokens: 4000,
    system: [
      {
        type: "text",
        text: GENERATION_SYSTEM_PROMPT_BASE,
        cache_control: { type: "ephemeral", ttl: "1h" },
      },
      { type: "text", text: curriculumContext },
      ...(wissensbasisContext ? [{ type: "text" as const, text: wissensbasisContext }] : []),
      { type: "text", text: AUFGABE_ERGAENZEN_SYSTEM_ZUSATZ },
    ],
    messages: [{ role: "user", content: buildAufgabeErgaenzenUserPrompt(content, req) }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("Die Antwort wurde abgeschnitten. Bitte nochmal versuchen.");
  }

  const rawText = getTextFromMessage(response);
  let parsed: { aufgabe: Aufgabe; loesung: string };
  try {
    const raw = extractJson(rawText);
    const ergebnis = AufgabeErgaenzenAntwortSchema.parse(raw);
    // "nr" wird von der Antwort bewusst nicht gesetzt (siehe Schema/Prompt) - hier nur als
    // Platzhalter ergänzt, die aufrufende Route/EditWorksheetForm vergibt die tatsächliche
    // fortlaufende Nummer.
    parsed = { aufgabe: { ...ergebnis.aufgabe, nr: 0 }, loesung: ergebnis.loesung };
  } catch (err) {
    console.error("Aufgabe-ergänzen-Antwort konnte nicht gelesen werden. Rohtext:", rawText);
    throw err;
  }

  // Sicherheitsnetz für diakritikfreie Transliteration, analog zu generiereUndPruefeEinmal in
  // lib/generateWorksheet.ts - VOR der Rückgabe, damit Bearbeiten-Formular/PDF/Word immer die
  // sicher darstellbare Version sehen.
  const bereinigt = vereinfacheArabischeTransliteration(parsed);

  return {
    aufgabe: bereinigt.aufgabe,
    loesung: bereinigt.loesung,
    usage: [usageEintragAusAntwort(GENERATION_MODEL, "aufgabe_ergaenzen", response.usage)],
  };
}
