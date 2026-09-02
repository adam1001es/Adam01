/** Gemeinsame Zellgrößen-Formel für Wortsuche-/Kreuzworträtsel-Gitter (Web-Vorschau + PDF, siehe
 * components/WorksheetView.tsx bzw. lib/pdf/WorksheetPdf.tsx) - aus Spaltenzahl und verfügbarer
 * Breite berechnet, statt eines festen Werts: ein fest verdrahteter Wert (früher z.B. 1.5em bzw.
 * 13pt) sah bei einem üblichen 10-16 Spalten breiten Gitter lächerlich klein aus (deutlich unter
 * 30% der Blattbreite statt sie sinnvoll auszunutzen). Zielt auf ca. 85% der verfügbaren Breite,
 * gedeckelt zwischen 16 und 40 (Einheiten des Aufrufers - px im Web, pt im PDF, praktisch nah
 * genug beieinander für denselben Wertebereich). */
export function berechneRaetselZellgroesse(verfuegbareBreite: number, spalten: number): number {
  const rohGroesse = (verfuegbareBreite * 0.85) / Math.max(1, spalten);
  return Math.max(16, Math.min(40, rohGroesse));
}
