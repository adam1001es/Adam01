import { describe, it, expect } from "vitest";
import { toHijri, formatDoppelDatum } from "./hijri";

// Bewusst keine hartkodierten "richtigen" Hijri-Datumswerte - welcher Tag im islamischen
// Kalender einem gregorianischen Datum entspricht, hängt vom verwendeten Berechnungsverfahren
// ab (siehe Hinweis "kann je nach Mondsichtung ±1 Tag abweichen" in formatDoppelDatum) und lässt
// sich nicht als einzelner unstrittiger Referenzwert einfrieren. Stattdessen: strukturelle
// Invarianten, die für JEDES Datum gelten müssen, plus eine breite Stichprobe gegen Abstürze.
describe("toHijri", () => {
  it("liefert Monat/Tag im gültigen Wertebereich", () => {
    const { tag, monat, jahr } = toHijri(new Date("2026-03-15"));
    expect(monat).toBeGreaterThanOrEqual(1);
    expect(monat).toBeLessThanOrEqual(12);
    expect(tag).toBeGreaterThanOrEqual(1);
    expect(tag).toBeLessThanOrEqual(30);
    expect(jahr).toBeGreaterThan(1400);
  });

  it("erzeugt ein Label im Format 'Tag. Monatsname Jahr n. H.'", () => {
    const { label } = toHijri(new Date("2026-03-15"));
    expect(label).toMatch(/^\d{1,2}\. [A-Za-zäöüÄÖÜß -]+ \d{4} n\. H\.$/);
  });

  it("wirft für keinen Tag in einem vollen Jahr und bleibt immer im gültigen Bereich", () => {
    const start = new Date("2026-01-01");
    for (let i = 0; i < 365; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const { monat, tag } = toHijri(date);
      expect(monat).toBeGreaterThanOrEqual(1);
      expect(monat).toBeLessThanOrEqual(12);
      expect(tag).toBeGreaterThanOrEqual(1);
      expect(tag).toBeLessThanOrEqual(30);
    }
  });

  it("das Hijri-Datum schreitet mit dem gregorianischen Datum monoton voran (kein Rückwärtssprung)", () => {
    let vorheriger = toHijri(new Date("2026-01-01"));
    for (let i = 1; i < 400; i++) {
      const date = new Date("2026-01-01");
      date.setDate(date.getDate() + i);
      const aktueller = toHijri(date);
      const vorherigesTuple: [number, number, number] = [
        vorheriger.jahr,
        vorheriger.monat,
        vorheriger.tag,
      ];
      const aktuellesTuple: [number, number, number] = [
        aktueller.jahr,
        aktueller.monat,
        aktueller.tag,
      ];
      // Lexikografischer Tupel-Vergleich statt einer gewichteten Summe - eine Summe wie
      // "jahr*355 + monat*30 + tag" wäre am Jahres-/Monatswechsel nicht zuverlässig ordnungstreu,
      // da Hijri-Monate unterschiedlich viele Tage (29 oder 30) haben. Reines JS-Array-">="
      // würde hier ebenfalls in die Irre führen (Vergleich über String-Konvertierung).
      expect(vergleicheTupel(aktuellesTuple, vorherigesTuple)).toBeGreaterThanOrEqual(0);
      vorheriger = aktueller;
    }
  });
});

function vergleicheTupel(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

describe("formatDoppelDatum", () => {
  it("enthält sowohl das gregorianische als auch das Hijri-Datum plus Unsicherheitshinweis", () => {
    const text = formatDoppelDatum(new Date("2026-03-15"));
    expect(text).toContain("15. März 2026");
    expect(text).toContain("n. H.");
    expect(text).toContain("±1 Tag abweichen");
  });
});
