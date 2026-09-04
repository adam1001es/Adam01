import { z } from "zod";

/** Persönlicher Stundenplan einer Lehrkraft (siehe app/werkzeuge/stundenplan) - bewusst freie
 * Zeiteinträge statt eines starren Perioden-Rasters, da Islamlehrkräfte oft an mehreren Schulen
 * mit jeweils EIGENEN Anfangszeiten/Stundenlängen/Pausen unterrichten (z.B. Schule A beginnt um
 * 7:50 mit 50-Minuten-Einheiten, Schule B um 8:00 mit 45-Minuten-Einheiten) - ein gemeinsames
 * Zeitraster über alle Schulen hinweg würde das nicht abbilden können. */

export interface Wochentag {
  wert: number;
  label: string;
  kurz: string;
}

/** 1=Montag ... 6=Samstag - Samstag bewusst mit dabei (manche höheren Schulen in Österreich sowie
 * Abendschulen haben auch samstags Unterricht), die Spalte wird in der UI aber nur angezeigt,
 * wenn tatsächlich ein Eintrag dafür existiert (siehe components/StundenplanEditor.tsx). */
export const WOCHENTAGE: Wochentag[] = [
  { wert: 1, label: "Montag", kurz: "Mo" },
  { wert: 2, label: "Dienstag", kurz: "Di" },
  { wert: 3, label: "Mittwoch", kurz: "Mi" },
  { wert: 4, label: "Donnerstag", kurz: "Do" },
  { wert: 5, label: "Freitag", kurz: "Fr" },
  { wert: 6, label: "Samstag", kurz: "Sa" },
] as const;

export function wochentagLabel(wert: number): string {
  return WOCHENTAGE.find((w) => w.wert === wert)?.label ?? "";
}

/** "HH:MM", 00-23:00-59 - reine Uhrzeit ohne Datum, siehe Kommentar bei StundenplanEintrag im
 * Prisma-Schema. Zweistellig gepolstert, damit String-Vergleich/-Sortierung wie Zeitvergleich
 * funktioniert (z.B. "07:50" < "08:00"). */
export const ZEIT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const StundenplanEintragEingabeSchema = z
  .object({
    wochentag: z.number().int().min(1).max(6),
    beginn: z.string().regex(ZEIT_REGEX, "Uhrzeit im Format HH:MM angeben."),
    ende: z.string().regex(ZEIT_REGEX, "Uhrzeit im Format HH:MM angeben."),
    schule: z.string().trim().min(1, "Schule angeben.").max(120),
    klasse: z.string().trim().min(1, "Klasse angeben.").max(60),
    schuelerangabe: z.string().trim().max(60).optional().nullable(),
  })
  .refine((data) => data.ende > data.beginn, {
    message: "Die Endzeit muss nach der Beginnzeit liegen.",
    path: ["ende"],
  });

export interface StundenplanEintragZeile {
  id: string;
  wochentag: number;
  beginn: string;
  ende: string;
  schule: string;
  klasse: string;
  schuelerangabe: string | null;
}

/** Gruppiert die Einträge nach Wochentag (jeweils nach Beginnzeit sortiert) - für die
 * Spaltenansicht im Editor. Tage ohne Einträge fehlen im Ergebnis-Map komplett. */
export function nachWochentagGruppiert(
  eintraege: StundenplanEintragZeile[],
): Map<number, StundenplanEintragZeile[]> {
  const gruppen = new Map<number, StundenplanEintragZeile[]>();
  for (const eintrag of eintraege) {
    const liste = gruppen.get(eintrag.wochentag) ?? [];
    liste.push(eintrag);
    gruppen.set(eintrag.wochentag, liste);
  }
  for (const liste of gruppen.values()) {
    liste.sort((a, b) => a.beginn.localeCompare(b.beginn));
  }
  return gruppen;
}
