import { WorksheetContent } from "./types";

/** Deterministisches, rein lokales Sicherheitsnetz gegen Zeichen-/Malaufgaben, die eine bildliche
 * Darstellung von Allah, einem Engel, einem Propheten oder einem Sahabi (Prophetengefährten)
 * verlangen - das ist im Islam nie erlaubt (siehe die entsprechende Regel in
 * GENERATION_SYSTEM_PROMPT_BASE, lib/generateWorksheet.ts). Läuft synchron in Millisekunden VOR
 * der KI-Prüfung (siehe generiereUndPruefeEinmal) - anders als die Prompt-Anweisung ist dieser
 * Check nicht darauf angewiesen, dass sich das Sprachmodell zuverlässig daran hält, und anders als
 * die KI-Prüfung fügt er keine zusätzliche Wartezeit/Kosten hinzu (kein weiterer Modellaufruf,
 * reiner Text-Abgleich).
 *
 * Bewusst eher zu empfindlich als zu lasch eingestellt: ein falscher Treffer (z.B. eine Aufgabe,
 * die "Allah" nur nennt, ohne wirklich eine Abbildung zu verlangen) kostet nur einen ohnehin
 * vorgesehenen automatischen Korrektur-Durchlauf (siehe generateAndVerifyWorksheet) - ein
 * verpasster Treffer wäre dagegen der tatsächliche inhaltliche Verstoß, ungeprüft an eine
 * Lehrkraft ausgeliefert. Prüft bewusst JEDE Aufgabe (nicht nur "malaufgabe"), falls eine
 * Zeichenanweisung versehentlich in einem anderen Aufgabentyp auftaucht. */
const ZEICHEN_VERB =
  /\b(mal(e|st|t|en|te|ten)?|zeichne(t|st|n|te|ten)?|skizzier(e|st|t|en|te|ten)?|abbild(e|est|et|en|ete|eten)?|bild(e|est|et)?\s+\S+\s+ab\b)\b/i;

// Namentliche Propheten sind bewusst mit aufgenommen (nicht nur der Gattungsbegriff "Prophet") -
// die Liste entspricht genau den in lib/curriculum.ts (THEMENBEREICHE-Beispiele je Schulstufe)
// bereits namentlich genannten Propheten, damit keine zweite, unabhängig zu pflegende Namensliste
// entsteht. Bewusst NICHT um einzelne Sahaba-/Engel-Namen (z.B. "Ali", "Aisha", "Jibril") erweitert
// - das sind zugleich ganz gewöhnliche heutige Vornamen, eine Namensliste dafür hätte ein
// unverhältnismäßig hohes Risiko falscher Treffer bei völlig unrelated eigenen Zeichenideen von
// Schüler:innen ("Male dich und deine Freundin Aisha im Park"). Die GATTUNGSbegriffe "Sahaba"/
// "Sahabi"/"Prophetengefährte" fangen die realistische Formulierung ("Male einen Sahabi, der...")
// weiterhin zuverlässig ab.
const VERBOTENE_FIGUR =
  /\b(allahs?|gott(es)?|engel(n|s)?|malaika|prophet(en)?|nabi|muhammads?|mohammeds?|gesandte(n)?\s+allahs|sahaba|sahabi|sahabah|prophetengef[aä]hrten?|gef[aä]hrten?\s+des\s+propheten|adam|hawa|nuh|musa|isa|maryam|yunus|ibrahim|yusuf|sulaiman)\b/i;

export interface DarstellungsverbotTreffer {
  aufgabeNr: number;
  aufgabeFrage: string;
}

/** Gibt eine Liste betroffener Aufgaben zurück (leer = kein Treffer). Prüft nur "frage" - dort
 * steht bei allen betroffenen Typen (v.a. "malaufgabe") die eigentliche Zeichenanweisung. */
export function findeUnzulaessigeZeichenaufgaben(
  content: WorksheetContent,
): DarstellungsverbotTreffer[] {
  const treffer: DarstellungsverbotTreffer[] = [];
  for (const aufgabe of content.aufgaben) {
    const text = aufgabe.frage ?? "";
    if (ZEICHEN_VERB.test(text) && VERBOTENE_FIGUR.test(text)) {
      treffer.push({ aufgabeNr: aufgabe.nr, aufgabeFrage: text });
    }
  }
  return treffer;
}
