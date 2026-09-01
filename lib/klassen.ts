import { THEMENBEREICH_KEYS } from "./curriculum";

/**
 * Reine Aggregations-Helfer für die Wissensstand-/Abdeckungs-Übersicht einer Klasse (siehe
 * app/klassen/[id]). Nehmen bewusst einfache, von der konkreten Prisma-Query entkoppelte
 * Eingabetypen (statt direkt Prisma.Zuweisung/Prisma.Ergebnis), damit sie ohne DB-Zugriff testbar
 * sind und sich auch für eine spätere API-Antwort (statt Server-Component-Query) wiederverwenden
 * lassen.
 */

export interface ZuweisungFuerAbdeckung {
  themenbereich: string;
  datum: Date;
  ergebnisse: { prozent: number | null }[];
}

export interface AbdeckungsEintrag {
  themenbereich: string;
  anzahlZuweisungen: number;
  letzteZuweisungAm: Date;
  /** null, solange noch kein Ergebnis für diesen Themenbereich eingetragen wurde. */
  durchschnittProzent: number | null;
}

function mittelwert(werte: number[]): number | null {
  if (werte.length === 0) return null;
  return werte.reduce((s, w) => s + w, 0) / werte.length;
}

/** Gruppiert Zuweisungen nach Themenbereich (Grundkompetenz) - Grundlage für die
 * "welche Grundkompetenzen wurden behandelt/wie stark"-Übersicht. Sortiert nach der festen
 * THEMENBEREICH_KEYS-Reihenfolge (unbekannte/legacy Werte landen am Ende), damit die Übersicht
 * bei jedem Aufruf gleich sortiert ist statt nach Häufigkeit zu springen. */
export function berechneAbdeckung(zuweisungen: ZuweisungFuerAbdeckung[]): AbdeckungsEintrag[] {
  const nachThemenbereich = new Map<string, ZuweisungFuerAbdeckung[]>();
  for (const z of zuweisungen) {
    const liste = nachThemenbereich.get(z.themenbereich) ?? [];
    liste.push(z);
    nachThemenbereich.set(z.themenbereich, liste);
  }

  const eintraege: AbdeckungsEintrag[] = Array.from(nachThemenbereich.entries()).map(
    ([themenbereich, liste]) => {
      const alleProzente = liste
        .flatMap((z) => z.ergebnisse)
        .map((e) => e.prozent)
        .filter((p): p is number => p !== null);
      return {
        themenbereich,
        anzahlZuweisungen: liste.length,
        letzteZuweisungAm: liste.reduce(
          (spaeteste, z) => (z.datum > spaeteste ? z.datum : spaeteste),
          liste[0].datum,
        ),
        durchschnittProzent: mittelwert(alleProzente),
      };
    },
  );

  const reihenfolge = new Map<string, number>(THEMENBEREICH_KEYS.map((k, i) => [k, i]));
  eintraege.sort(
    (a, b) => (reihenfolge.get(a.themenbereich) ?? 99) - (reihenfolge.get(b.themenbereich) ?? 99),
  );
  return eintraege;
}

export interface ErgebnisFuerSchuelerUebersicht {
  schuelerId: string;
  prozent: number | null;
}

export interface SchuelerUebersicht {
  schuelerId: string;
  anzahlErgebnisse: number;
  durchschnittProzent: number | null;
}

/** Durchschnitt pro Schüler über alle vorliegenden Ergebnisse hinweg (unabhängig vom
 * Themenbereich) - "schuelerIds" wird separat übergeben statt aus den Ergebnissen abgeleitet,
 * damit auch Schüler:innen OHNE ein einziges Ergebnis mit `durchschnittProzent: null` in der
 * Liste erscheinen (sichtbare Lücke statt stillem Fehlen). */
export function berechneSchuelerUebersicht(
  schuelerIds: string[],
  ergebnisse: ErgebnisFuerSchuelerUebersicht[],
): SchuelerUebersicht[] {
  const nachSchueler = new Map<string, number[]>();
  for (const id of schuelerIds) nachSchueler.set(id, []);
  for (const e of ergebnisse) {
    if (e.prozent === null) continue;
    const liste = nachSchueler.get(e.schuelerId);
    if (liste) liste.push(e.prozent);
  }
  return schuelerIds.map((schuelerId) => {
    const werte = nachSchueler.get(schuelerId) ?? [];
    return { schuelerId, anzahlErgebnisse: werte.length, durchschnittProzent: mittelwert(werte) };
  });
}

/** Gesamt-Klassendurchschnitt über ALLE eingetragenen Ergebnisse - für die Kopfzeile der
 * Klassen-Übersicht. */
export function berechneKlassenDurchschnitt(ergebnisse: { prozent: number | null }[]): number | null {
  return mittelwert(ergebnisse.map((e) => e.prozent).filter((p): p is number => p !== null));
}

export interface ZuweisungFuerVerlauf {
  id: string;
  titel: string;
  datum: Date;
  istPruefung: boolean;
  ergebnisse: { schuelerId: string; prozent: number | null; notiz: string | null }[];
}

export interface VerlaufsEintrag {
  zuweisungId: string;
  titel: string;
  datum: Date;
  istPruefung: boolean;
  prozent: number | null;
  notiz: string | null;
}

/** Chronologischer Ergebnisverlauf einer einzelnen Person über alle Zuweisungen der Klasse -
 * Grundlage für die Detailansicht im Klassenzimmer (siehe components/Klassenzimmer.tsx). Nur
 * Zuweisungen, für die tatsächlich ein Ergebnis-Datensatz existiert (auch mit prozent: null,
 * z.B. "erfasst aber noch nicht benotet") tauchen auf - reine Nicht-Teilnahme wird nicht
 * unterschieden von "noch nicht eingetragen". */
export function berechneSchuelerVerlauf(
  schuelerId: string,
  zuweisungen: ZuweisungFuerVerlauf[],
): VerlaufsEintrag[] {
  return zuweisungen
    .flatMap((z) => {
      const ergebnis = z.ergebnisse.find((e) => e.schuelerId === schuelerId);
      if (!ergebnis) return [];
      return [
        {
          zuweisungId: z.id,
          titel: z.titel,
          datum: z.datum,
          istPruefung: z.istPruefung,
          prozent: ergebnis.prozent,
          notiz: ergebnis.notiz,
        },
      ];
    })
    .sort((a, b) => a.datum.getTime() - b.datum.getTime());
}
