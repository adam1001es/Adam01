import { z } from "zod";

/** Jahresplanung (siehe app/werkzeuge/jahresplanung) - die vom Fachinspektor als Dienstpflicht
 * beschriebene Wochenplanung pro Religionsunterrichtsgruppe (siehe lib/jahresplanKalender.ts für
 * die zugrundeliegenden offiziellen Kalenderdaten). Bewusst ein EIGENES Modell statt an die
 * bestehende Klasse-Entität (siehe lib/klassen.ts) gekoppelt: eine Jahresplanungs-Gruppe muss
 * keine im System mit Schüler-Roster angelegte Klasse sein (die Vorlage kennt nur einen freien
 * Gruppennamen), und nicht jede angelegte Klasse braucht zwingend eine Jahresplanung. */

export const JAHRESPLAN_GRUPPE_MAX_LAENGE = 120;
export const JAHRESPLAN_FREITEXT_MAX_LAENGE = 500;
export const JAHRESPLAN_WOCHE_FELD_MAX_LAENGE = 2000;

export const JahresplanErstellenSchema = z.object({
  variante: z.string().trim().min(1, "Bitte den Schulbeginn-Termin wählen."),
  gruppe: z.string().trim().min(1, "Bitte einen Gruppennamen angeben.").max(JAHRESPLAN_GRUPPE_MAX_LAENGE),
  erstelltVon: z.string().trim().max(JAHRESPLAN_GRUPPE_MAX_LAENGE).optional().nullable(),
  bemerkungenGruppe: z.string().trim().max(JAHRESPLAN_FREITEXT_MAX_LAENGE).optional().nullable(),
  speziellerFokus: z.string().trim().max(JAHRESPLAN_FREITEXT_MAX_LAENGE).optional().nullable(),
});

export const JahresplanWocheEingabeSchema = z.object({
  nummer: z.number().int().min(1),
  wochenthema: z.string().trim().max(JAHRESPLAN_WOCHE_FELD_MAX_LAENGE).optional().nullable(),
  kompetenzen: z.string().trim().max(JAHRESPLAN_WOCHE_FELD_MAX_LAENGE).optional().nullable(),
  notizen: z.string().trim().max(JAHRESPLAN_WOCHE_FELD_MAX_LAENGE).optional().nullable(),
});

export const JahresplanWochenSpeichernSchema = z.object({
  wochen: z.array(JahresplanWocheEingabeSchema).min(1).max(60),
});

export interface JahresplanWocheZeile {
  id: string;
  nummer: number;
  wochenthema: string | null;
  kompetenzen: string | null;
  notizen: string | null;
}

/** Formatiert eine ISO-Datumsspanne (siehe JahresplanKalenderWoche) wie in der offiziellen
 * Vorlage: "07.09. – 13.09.26". */
export function formatWochenDatum(von: string, bis: string): string {
  const [vonJahr, vonMonat, vonTag] = von.split("-");
  const [bisJahr, bisMonat, bisTag] = bis.split("-");
  return `${vonTag}.${vonMonat}. – ${bisTag}.${bisMonat}.${bisJahr.slice(2)}`;
}
