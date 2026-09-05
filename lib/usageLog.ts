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
  // "zusammenstellung" = Prüfungs-Modus A (lib/pruefungZusammenstellen.ts) - deutlich günstiger
  // als eine volle Neu-Generierung, da nur aus bereits vorhandenen Aufgaben ausgewählt statt neu
  // formuliert wird, daher als eigene Phase geführt statt unter "generierung" mitgezählt (sonst
  // würde die Admin-Kostenübersicht die beiden Größenordnungen vermischen).
  // "aufgabe_ergaenzen" = nachträgliches Hinzufügen EINER Aufgabe zu einem bereits bestehenden
  // Arbeitsblatt (siehe lib/aufgabeErgaenzen.ts) - ebenfalls deutlich günstiger als eine volle
  // Neu-Generierung (ein einzelner Aufruf ohne separate Verifikationsstufe).
  // "ideen" = Themenideen-Vorschläge (siehe app/api/thema-ideen) und "meldung_fix" = automatische
  // Meldungs-Analyse/-Korrektur (siehe lib/meldungFix.ts) - beide riefen bisher Claude auf, OHNE
  // die Kosten hier zu erfassen (gefundene Lücke: die "echten Kosten"-Anzeige in app/admin/kosten
  // lag dadurch spürbar unter dem tatsächlichen Anthropic-Rechnungsbetrag). Beide bewusst NICHT
  // in verbrauchtePunkteFuerUser einbezogen (Themenideen haben ihr eigenes Tageslimit, siehe
  // lib/themaIdeen.ts; ein Meldungs-Autofix soll die meldende Lehrkraft nicht zusätzlich Guthaben
  // kosten) - nur für die echte Kosten-Übersicht relevant.
  phase: "generierung" | "pruefung" | "zusammenstellung" | "aufgabe_ergaenzen" | "ideen" | "meldung_fix";
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

/** Zählt, für wie viele VERSCHIEDENE Arbeitsblätter seit einem Zeitpunkt (oder insgesamt)
 * UsageLog-Zeilen existieren - Grundlage für einen echten Durchschnittspreis pro Arbeitsblatt
 * (siehe durchschnittKostenProBlattEur). Zählt auch bereits gelöschte Arbeitsblätter mit, da
 * worksheetId nur eine lose Referenz ist (siehe Schema-Kommentar). */
async function zaehleBlaetterMitUsage(seit?: Date): Promise<number> {
  const gruppen = await prisma.usageLog.groupBy({
    by: ["worksheetId"],
    where: { worksheetId: { not: null }, ...(seit ? { createdAt: { gte: seit } } : {}) },
  });
  return gruppen.length;
}

export interface DurchschnittsKosten {
  /** null, solange noch keine Arbeitsblätter mit UsageLog-Daten existieren (Division durch 0). */
  durchschnittEur: number | null;
  anzahlBlaetter: number;
}

/** Echte Token-Nutzung EINES Kontos seit einem Zeitpunkt (oder insgesamt) - fürs Punkte-Guthaben
 * (siehe verbrauchtePunkteFuerUser) reicht die Kosten-Summe, aber für die Token-Übersicht im
 * Account-Bereich (siehe app/account/page.tsx) wird zusätzlich die rohe Tokenzahl gebraucht.
 * Eigene Funktion statt summeTokens() mit optionalem userId-Filter, um dessen bestehende
 * Admin-Verwendung (globale Summe über alle Konten, siehe app/admin/kosten) nicht anzufassen. */
export async function summeTokensFuerUser(userId: string, seit?: Date): Promise<TokenSumme> {
  const ergebnis = await prisma.usageLog.aggregate({
    where: { userId, ...(seit ? { createdAt: { gte: seit } } : {}) },
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

/** Echte, in Punkte umgerechnete Kosten (1 Punkt = 1 Cent tatsächliche Kosten) EINES Kontos seit
 * einem Zeitpunkt (oder insgesamt, für das lebenslange Gratis-Kontingent) - die Grundlage für
 * das Punkte-Guthaben (siehe getKontingent in lib/quota.ts). Zählt bewusst NUR die Phasen
 * "generierung" + "pruefung" (eine volle, kontingentpflichtige Arbeitsblatt-Erstellung) -
 * "zusammenstellung" (Prüfungs-Modus A, lib/pruefungZusammenstellen.ts) und "aufgabe_ergaenzen"
 * (lib/aufgabeErgaenzen.ts) sind bewusst eigene, kontingentfreie Wege (siehe dortige Kommentare)
 * und dürfen das Guthaben nicht belasten. Arbeitsblätter, die von einem Admin als fehlerhaft
 * erstattet wurden (Worksheet.erstattet), werden ebenfalls ausgeschlossen - die Lehrkraft
 * bekommt ihr Guthaben dafür zurück, ohne dass das Arbeitsblatt selbst gelöscht werden muss. */
export async function verbrauchtePunkteFuerUser(userId: string, seit?: Date): Promise<number> {
  const erstatteteWorksheets = await prisma.worksheet.findMany({
    where: { userId, erstattet: true },
    select: { id: true },
  });
  const erstatteteIds = erstatteteWorksheets.map((w) => w.id);

  const proModell = await prisma.usageLog.groupBy({
    by: ["model"],
    where: {
      userId,
      phase: { in: ["generierung", "pruefung"] },
      ...(seit ? { createdAt: { gte: seit } } : {}),
      ...(erstatteteIds.length > 0 ? { worksheetId: { notIn: erstatteteIds } } : {}),
    },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      cacheCreationInputTokens: true,
      cacheReadInputTokens: true,
    },
  });

  const kostenEur = proModell.reduce(
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
  return Math.round(kostenEur * 100);
}

export interface TagesKosten {
  /** YYYY-MM-DD in UTC (toISOString) - die Anthropic-Konsole zeigt Tage ebenfalls in UTC, daher
   * bewusst keine Umrechnung auf die österreichische Lokalzeit, um einen 1:1-Abgleich zu erlauben. */
  tag: string;
  kostenEur: number;
  tokensGesamt: number;
  anzahlAufrufe: number;
}

/** Echte Kosten PRO TAG für die letzten `tageAnzahl` Tage (inkl. heute) - Grundlage für einen
 * direkten Abgleich einzelner Tage mit der Anthropic-Rechnungsübersicht (die dort nur EINEN
 * Gesamtbetrag über alle angebundenen Projekte zeigt, hier aber tageweise genau für Lernwerk).
 * Holt die Rohzeilen einmal und gruppiert in JS statt per SQL-Datumsgruppierung, da
 * berechneKostenEur() pro Modell unterschiedliche Preise braucht (siehe summeKostenEur) und im
 * Projekt bisher bewusst kein Raw-SQL verwendet wird. Tage ohne jeden Aufruf fehlen in der
 * zurückgegebenen Liste komplett (kein Nulleintrag). */
export async function summeKostenProTag(tageAnzahl: number): Promise<TagesKosten[]> {
  const seit = new Date();
  seit.setDate(seit.getDate() - (tageAnzahl - 1));
  seit.setHours(0, 0, 0, 0);

  const zeilen = await prisma.usageLog.findMany({
    where: { createdAt: { gte: seit } },
    select: {
      createdAt: true,
      model: true,
      inputTokens: true,
      outputTokens: true,
      cacheCreationInputTokens: true,
      cacheReadInputTokens: true,
    },
  });

  const proTagUndModell = new Map<string, Map<string, TokenSumme>>();
  for (const zeile of zeilen) {
    const tag = zeile.createdAt.toISOString().slice(0, 10);
    if (!proTagUndModell.has(tag)) proTagUndModell.set(tag, new Map());
    const proModell = proTagUndModell.get(tag)!;
    const bisher = proModell.get(zeile.model) ?? {
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      gesamt: 0,
      anzahlAufrufe: 0,
    };
    bisher.inputTokens += zeile.inputTokens;
    bisher.outputTokens += zeile.outputTokens;
    bisher.cacheCreationInputTokens += zeile.cacheCreationInputTokens;
    bisher.cacheReadInputTokens += zeile.cacheReadInputTokens;
    bisher.gesamt +=
      zeile.inputTokens + zeile.outputTokens + zeile.cacheCreationInputTokens + zeile.cacheReadInputTokens;
    bisher.anzahlAufrufe += 1;
    proModell.set(zeile.model, bisher);
  }

  const ergebnis: TagesKosten[] = [];
  for (const [tag, proModell] of proTagUndModell) {
    let kostenEur = 0;
    let tokensGesamt = 0;
    let anzahlAufrufe = 0;
    for (const [model, summe] of proModell) {
      kostenEur += berechneKostenEur(model, summe);
      tokensGesamt += summe.gesamt;
      anzahlAufrufe += summe.anzahlAufrufe;
    }
    ergebnis.push({ tag, kostenEur, tokensGesamt, anzahlAufrufe });
  }
  return ergebnis.sort((a, b) => b.tag.localeCompare(a.tag));
}

/** Echter Durchschnittspreis pro Arbeitsblatt in € - die belastbare Grundlage für die
 * Preiskalkulation (siehe README/Abo-Kalkulation in lib/quota.ts), statt der bisherigen
 * Pauschalschätzung GESCHAETZTE_KOSTEN_TEXT_PRO_BLATT_EUR oder eines einzelnen Datenpunkts. Je
 * mehr echte Arbeitsblätter eingeflossen sind (siehe "anzahlBlaetter"), desto verlässlicher der
 * Wert - bei sehr wenigen Datenpunkten (z.B. unter 20-30) noch mit Vorsicht für eine endgültige
 * Preisentscheidung nutzen. */
export async function durchschnittKostenProBlattEur(seit?: Date): Promise<DurchschnittsKosten> {
  const [kosten, anzahlBlaetter] = await Promise.all([
    summeKostenEur(seit),
    zaehleBlaetterMitUsage(seit),
  ]);
  return { durchschnittEur: anzahlBlaetter === 0 ? null : kosten / anzahlBlaetter, anzahlBlaetter };
}
