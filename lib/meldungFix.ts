import { getAnthropicClient, GENERATION_MODEL, extractJson, getTextFromMessage } from "./anthropic";
import { WorksheetContent, MeldungAnalyseSchema, MeldungKategorie, MELDUNG_KATEGORIE_LABEL } from "./types";
import { begrenzeAufgabenProTyp, loeseRaetselAuf } from "./generateWorksheet";

/** Greift eine Lehrkraft-Meldung sofort automatisch auf (siehe app/api/worksheet/[id]/meldung):
 * Claude bekommt Kategorie, Freitext-Beschreibung und den vollständigen Arbeitsblatt-Inhalt.
 * Bewusst dasselbe fachliche/pädagogische Regelwerk wie bei der Erstellung (siehe
 * generateWorksheet.ts), damit eine Korrektur nicht neue Fehler einführt. */
const MELDUNG_ANALYSE_SYSTEM_PROMPT = `Du bist eine erfahrene Qualitätsprüferin für Arbeitsblätter im islamischen Religionsunterricht an österreichischen Schulen (staatlich anerkannter konfessioneller Unterricht, Lehrpläne der IGGÖ). Dieselbe fachliche/pädagogische Sorgfalt wie bei der Erstellung gilt auch hier: mehrheitsfähige, sunnitische Grundposition, durchgehend "Allah" statt "Gott", niemals erfundene Sure-/Hadith-Angaben, altersgerechte Sprache für die angegebene Schulstufe.

Eine Lehrkraft hat ein konkretes Problem an einem bereits fertigen Arbeitsblatt gemeldet. Du bekommst die Kategorie der Meldung, eine optionale Freitext-Beschreibung sowie den vollständigen Arbeitsblatt-Inhalt als JSON.

Deine Aufgabe:
1. Prüfe zuerst, ob das gemeldete Problem tatsächlich vorliegt - nicht jede Meldung ist automatisch berechtigt.
2. Falls ja UND du das Problem mit hinreichender Sicherheit beheben kannst: liefere in "korrigierterInhalt" den VOLLSTÄNDIGEN korrigierten Arbeitsblatt-Inhalt im exakt gleichen JSON-Schema wie das Original. Ändere NUR, was zur Behebung nötig ist - Aufgaben-Reihenfolge, -Nummern und alle übrigen Aufgaben bleiben unverändert, außer eine Korrektur macht das zwingend nötig.
   - Fehlende/unvollständige Aufgabe: ergänze/korrigiere die betroffene Aufgabe UND die zugehörige Lösung (gleiche "nr").
   - Fehlerhafter Text: korrigiere den betroffenen Text (Frage, Lösung, Lesetext, Einleitung, Lernziel, ...).
3. Falls das Problem real ist, du es aber NICHT mit hinreichender Sicherheit beheben kannst (z.B. zu vage Beschreibung, um die betroffene Stelle sicher zu identifizieren): setze "korrigierterInhalt" auf null - das geht dann an ein menschliches Review.
4. Falls das gemeldete Problem nicht nachvollziehbar ist (das Arbeitsblatt ist an der fraglichen Stelle tatsächlich in Ordnung): setze "problemBestaetigt": false.

WICHTIG zur Formulierung von "diagnose" (wird SOWOHL der meldenden Lehrkraft direkt angezeigt ALS AUCH im Admin-Bereich): Schreibe wie eine externe Fachkollegin, die kurz Rückmeldung zur Meldung gibt, NIEMALS wie eine Erklärung der eigenen Prüf-/Korrekturmethodik. Nenne dabei NIE interne Bezeichner aus diesem Prompt oder dem JSON-Schema wörtlich (z.B. niemals "korrigierterInhalt", "problemBestaetigt" als Begriffe) und beschreibe nicht, WIE die Korrektur technisch umgesetzt wurde - sag stattdessen einfach und konkret, WAS inhaltlich geändert wurde bzw. was das Problem war (z.B. "Die fehlende Lösung bei Aufgabe 3 wurde ergänzt."). Kurz, direkt, wie eine normale Rückmeldung an eine Kollegin - nicht wie ein technischer Systembericht.

Antworte NUR mit einem einzigen JSON-Objekt, ohne Markdown-Codeblock, ohne Erklärtext davor oder danach:
{ "problemBestaetigt": boolean, "diagnose": string, "korrigierterInhalt": <vollständiges Arbeitsblatt-JSON-Objekt im Originalschema, siehe oben> oder null }
"diagnose" ist eine kurze, für die meldende Lehrkraft direkt verständliche Rückmeldung in 1-3 Sätzen: was war das Problem (falls bestätigt) und was wurde geändert (falls behoben) bzw. warum es nicht automatisch behebbar/nicht nachvollziehbar ist.`;

export interface MeldungFixErgebnis {
  status: "automatisch_behoben" | "nicht_behebbar" | "kein_fehler_gefunden" | "fehler";
  diagnose: string;
  neuerInhalt?: WorksheetContent;
}

export async function analysiereUndBehebeMeldung(
  aktuellerInhalt: WorksheetContent,
  kategorie: MeldungKategorie,
  beschreibung: string | null,
): Promise<MeldungFixErgebnis> {
  try {
    const client = getAnthropicClient();
    const text = `Gemeldetes Problem: ${MELDUNG_KATEGORIE_LABEL[kategorie]}${
      beschreibung
        ? `\nGenauere Beschreibung der Lehrkraft: ${beschreibung}`
        : "\n(Keine genauere Beschreibung angegeben.)"
    }\n\nAktueller Arbeitsblatt-Inhalt (JSON):\n${JSON.stringify(aktuellerInhalt, null, 2)}`;

    const response = await client.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 16000,
      system: MELDUNG_ANALYSE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    if (response.stop_reason === "max_tokens") {
      return {
        status: "fehler",
        diagnose: "Die KI-Antwort wurde wegen zu vieler Inhalte abgeschnitten. Bitte manuell prüfen.",
      };
    }

    const raw = extractJson(getTextFromMessage(response));
    const analyse = MeldungAnalyseSchema.parse(raw);

    if (!analyse.problemBestaetigt) {
      return { status: "kein_fehler_gefunden", diagnose: analyse.diagnose };
    }
    if (!analyse.korrigierterInhalt) {
      return { status: "nicht_behebbar", diagnose: analyse.diagnose };
    }

    const neuerInhalt = analyse.korrigierterInhalt;
    begrenzeAufgabenProTyp(neuerInhalt);
    loeseRaetselAuf(neuerInhalt);

    return { status: "automatisch_behoben", diagnose: analyse.diagnose, neuerInhalt };
  } catch (err) {
    console.error("Meldung-Autofix fehlgeschlagen:", err);
    return {
      status: "fehler",
      diagnose: "Die automatische Analyse ist technisch fehlgeschlagen. Bitte manuell prüfen.",
    };
  }
}
