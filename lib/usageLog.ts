import { prisma } from "@/lib/prisma";
import type Anthropic from "@anthropic-ai/sdk";
import { berechneKostenEur } from "@/lib/pricing";

/**
 * Echte Claude-Token-Nutzung, persistiert unabhängig vom zugehörigen Worksheet (siehe
 * UsageLog in prisma/schema.prisma) - im Unterschied zur groben Pauschalschätzung in
 * lib/quota.ts (GESCHAETZTE_KOSTEN_TEXT_PRO_BLATT_EUR) sind das die tatsächlich von Claude
 * zurückgemeldeten Tokenzahlen. Die €-Umrechnung (siehe summeKostenEur) nutzt echte
 * Anthropic-Listenpreise pro Modell (lib/pricing.ts), ist aber trotzdem eine Schätzung
 * (Listenpreis, gerundeter Wechselkurs) - bei einer Preisänderung dort aktualisieren.
 */
export interface UsageEintrag {
  model: string;
  phase: "generierung" | "pruefung";
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

/** Wandelt die rohe `usage`-Angabe einer Claude-Antwort in einen UsageEintrag um (null-Felder
 * werden zu 0, siehe Anthropic.Usage - cache-Felder sind nullable). */
export function usageEintragAusAntwort(
  model: string,
  phase: UsageEintrag["phase"],
  usage: Anthropic.Usage,
): UsageEintrag {
  return {
    model,
    phase,
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens,
    cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
  };
}

/** Persistiert eine Liste von UsageEintrag-Objekten (typischerweise 2-4 pro Arbeitsblatt-
 * Anfrage: Erstellung + Prüfung, ggf. verdoppelt bei einem automatischen zweiten Versuch, siehe
 * generateAndVerifyWorksheet). worksheetId ist nur eine lose Referenz (kein FK, siehe Schema-
 * Kommentar) - bewusst so gespeichert, dass ein späteres Löschen des Arbeitsblatts diese Zeilen
 * nicht mitreißt. */
export async function speichereUsage(
  eintraege: UsageEintrag[],
  userId: string | null,
  worksheetId: string | null,
): Promise<void> {
  if (eintraege.length === 0) return;
  await prisma.usageLog.createMany({
    data: eintraege.map((e) => ({
      userId,
      worksheetId,
      model: e.model,
      phase: e.phase,
      inputTokens: e.inputTokens,
      outputTokens: e.outputTokens,
      cacheCreationInputTokens: e.cacheCreationInputTokens,
      cacheReadInputTokens: e.cacheReadInputTokens,
    })),
  });
}

export interface TokenSumme {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  gesamt: number;
  anzahlAufrufe: number;
}

/** Summiert echte Token-Nutzung seit einem Zeitpunkt (oder insgesamt, falls "seit" weggelassen) -
 * über ALLE noch existierenden UND bereits gelöschten Arbeitsblätter hinweg, da UsageLog
 * unabhängig vom Worksheet besteht (siehe Schema-Kommentar). */
export async function summeTokens(seit?: Date): Promise<TokenSumme> {
  const ergebnis = await prisma.usageLog.aggregate({
    where: seit ? { createdAt: { gte: seit } } : undefined,
    _sum: {
      inputTokens: true,
      outputTokens: true,
      cacheCreationInputTokens: true,
      cacheReadInputTokens: true,
    },
    _count: true,
  });
  const inputTokens = ergebnis._sum.inputTokens ?? 0;
  const outputTokens = ergebnis._sum.outputTokens ?? 0;
  const cacheCreationInputTokens = ergebnis._sum.cacheCreationInputTokens ?? 0;
  const cacheReadInputTokens = ergebnis._sum.cacheReadInputTokens ?? 0;
  return {
    inputTokens,
    outputTokens,
    cacheCreationInputTokens,
    cacheReadInputTokens,
    gesamt: inputTokens + outputTokens + cacheCreationInputTokens + cacheReadInputTokens,
    anzahlAufrufe: ergebnis._count,
  };
}

/** Berechnet die echten Kosten in € seit einem Zeitpunkt (oder insgesamt) - GRUPPIERT nach
 * Modell, da Erstellung (Opus) und Prüfung (Sonnet) unterschiedliche Preise haben (siehe
 * lib/pricing.ts) und ein einzelner Mischpreis über die Summe hinweg falsch wäre. */
export async function summeKostenEur(seit?: Date): Promise<number> {
  const proModell = await prisma.usageLog.groupBy({
    by: ["model"],
    where: seit ? { createdAt: { gte: seit } } : undefined,
    _sum: {
      inputTokens: true,
      outputTokens: true,
      cacheCreationInputTokens: true,
      cacheReadInputTokens: true,
    },
  });
  return proModell.reduce(
    (summe, gruppe) =>
      summe +
      berechneKostenEur(gruppe.model, {
        inputTokens: gruppe._sum.inputTokens ?? 0,
        outputTokens: gruppe._sum.outputTokens ?? 0,
        cacheCreationInputTokens: gruppe._sum.cacheCreationInputTokens ?? 0,
        cacheReadInputTokens: gruppe._sum.cacheReadInputTokens ?? 0,
      }),
    0,
  );
}
