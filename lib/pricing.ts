import { GENERATION_MODEL, VERIFICATION_MODEL } from "@/lib/models";

/**
 * Anthropic-Listenpreise in USD pro 1 Million Token (Stand: Anthropic-Preisliste, geprüft
 * 01.09.2026) - für die Umrechnung der echten UsageLog-Tokenzahlen (siehe lib/usageLog.ts) in
 * einen tatsächlichen €-Betrag statt der groben Pauschalschätzung in lib/quota.ts. Bei einer
 * Preisänderung durch Anthropic oder einem Modellwechsel (siehe lib/anthropic.ts) hier anpassen.
 */
const PREISE_USD_PRO_MIO_TOKEN: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5.0, output: 25.0 },
  "claude-sonnet-5": { input: 2.0, output: 10.0 },
};

// Cache-Schreiben/-Lesen wird nicht zum vollen Input-Preis verrechnet, sondern als Vielfaches
// davon - Standard-Verhältnis bei allen Claude-Modellen (siehe Anthropic-Dokumentation zu
// Prompt Caching): Schreiben ~1,25x, Lesen ~0,1x des normalen Input-Preises.
const CACHE_SCHREIB_FAKTOR = 1.25;
const CACHE_LESE_FAKTOR = 0.1;

// Näherungsweiser USD->EUR-Kurs (Stand 01.09.2026: 1 USD ≈ 0,86€, EZB-Referenzkurs-Bereich) -
// bewusst als grober, gerundeter Wert hinterlegt statt live abgefragt (keine Kursschwankung
// während einer Anfrage relevant für eine "geschätzte Kosten"-Anzeige) - bei spürbarer
// Kursänderung hier auffrischen.
const USD_EUR_KURS = 0.86;

export interface TokenMengen {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

/** Berechnet die tatsächlichen Kosten (in €) für eine Tokenmenge EINES bestimmten Modells -
 * unbekannte Modell-IDs (z.B. nach einem Modellwechsel, für den diese Tabelle noch nicht
 * aktualisiert wurde) liefern 0 statt eines falschen Werts. */
export function berechneKostenEur(model: string, mengen: TokenMengen): number {
  const preise = PREISE_USD_PRO_MIO_TOKEN[model];
  if (!preise) return 0;
  const usd =
    (mengen.inputTokens * preise.input) / 1_000_000 +
    (mengen.outputTokens * preise.output) / 1_000_000 +
    (mengen.cacheCreationInputTokens * preise.input * CACHE_SCHREIB_FAKTOR) / 1_000_000 +
    (mengen.cacheReadInputTokens * preise.input * CACHE_LESE_FAKTOR) / 1_000_000;
  return usd * USD_EUR_KURS;
}

/** Für die Admin-Anzeige: Hinweistext zur Berechnungsgrundlage, damit die €-Zahl nicht als
 * exakter Rechnungsbetrag missverstanden wird (Listenpreise, gerundeter Wechselkurs). */
export const KOSTEN_BERECHNUNGSGRUNDLAGE = `Anthropic-Listenpreise (${GENERATION_MODEL} + ${VERIFICATION_MODEL}), Kurs 1 USD ≈ ${USD_EUR_KURS}€ - geschätzt, kein exakter Rechnungsbetrag`;
