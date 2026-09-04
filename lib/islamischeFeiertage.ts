import { toHijri } from "./hijri";

/**
 * Wichtige Termine im islamischen (Hijri-)Kalender, rein aus dem tabellarischen Kalender
 * berechnet (siehe lib/hijri.ts) - KEIN KI-Aufruf, KEIN Kontingent-Verbrauch. Dient
 * Religionslehrkräften zur Unterrichtsplanung (Werkzeuge-Bereich, siehe app/werkzeuge/kalender).
 * Wie beim zugrundeliegenden zivilen Hijri-Kalender gilt: das tatsächliche, in der Praxis
 * gefeierte Datum kann je nach lokaler Mondsichtung um einen Tag abweichen - das hier ist eine
 * verlässliche Näherung für die Planung, kein religiöses Gutachten.
 */

export interface IslamischerFeiertag {
  id: string;
  name: string;
  hijriMonat: number; // 1-12
  hijriTag: number;
  hinweis?: string;
}

export const ISLAMISCHE_FEIERTAGE: IslamischerFeiertag[] = [
  { id: "neujahr", name: "Islamisches Neujahr", hijriMonat: 1, hijriTag: 1 },
  { id: "aschura", name: "Aschura", hijriMonat: 1, hijriTag: 10 },
  {
    id: "mawlid",
    name: "Mawlid an-Nabi (Geburtstag des Propheten)",
    hijriMonat: 3,
    hijriTag: 12,
    hinweis: "Datum nach sunnitischer Zählung (12. Rabi al-Awwal) - wird nicht überall gefeiert.",
  },
  { id: "ramadan_beginn", name: "Ramadan-Beginn", hijriMonat: 9, hijriTag: 1 },
  { id: "lailat_al_qadr", name: "Lailat al-Qadr (voraussichtlich, 27. Ramadan)", hijriMonat: 9, hijriTag: 27 },
  { id: "eid_al_fitr", name: "Eid al-Fitr (Ramadanfest)", hijriMonat: 10, hijriTag: 1 },
  { id: "eid_al_adha", name: "Eid al-Adha (Opferfest)", hijriMonat: 12, hijriTag: 10 },
];

const TAGE_PRO_HIJRI_JAHR_CA = 354;
const SUCHFENSTER_TAGE = TAGE_PRO_HIJRI_JAHR_CA * 2 + 30;

/** Sucht ab einem Startdatum vorwärts das nächste Gregorianische Datum, an dem der Hijri-Kalender
 * den gewünschten Monat/Tag zeigt (Tag für Tag über das Suchfenster, da Intl keine Hijri->
 * Gregorianisch-Rückrechnung anbietet - für eine einmal pro Seitenaufruf berechnete Handvoll
 * Feiertage performant genug). */
function naechstesHijriDatum(monat: number, tag: number, ab: Date): Date | null {
  const start = new Date(ab);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < SUCHFENSTER_TAGE; i++) {
    const kandidat = new Date(start);
    kandidat.setDate(kandidat.getDate() + i);
    const hijri = toHijri(kandidat);
    if (hijri.monat === monat && hijri.tag === tag) return kandidat;
  }
  return null;
}

export interface KommenderFeiertag extends IslamischerFeiertag {
  datum: Date;
}

/** Die nächste Vorkommnis jedes Feiertags ab heute (bzw. einem übergebenen Datum) - für die
 * Schuljahresübersicht in app/werkzeuge/kalender, chronologisch sortiert. */
export function kommendeFeiertage(ab: Date = new Date()): KommenderFeiertag[] {
  return ISLAMISCHE_FEIERTAGE.map((f) => {
    const datum = naechstesHijriDatum(f.hijriMonat, f.hijriTag, ab);
    return datum ? { ...f, datum } : null;
  })
    .filter((f): f is KommenderFeiertag => f !== null)
    .sort((a, b) => a.datum.getTime() - b.datum.getTime());
}
