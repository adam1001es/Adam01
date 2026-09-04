import { describe, it, expect } from "vitest";
import { kommendeFeiertage, ISLAMISCHE_FEIERTAGE } from "./islamischeFeiertage";
import { toHijri } from "./hijri";

describe("kommendeFeiertage", () => {
  it("liefert für jeden bekannten Feiertag genau einen kommenden Termin", () => {
    const ergebnis = kommendeFeiertage(new Date("2026-01-01"));
    expect(ergebnis).toHaveLength(ISLAMISCHE_FEIERTAGE.length);
  });

  it("jedes berechnete Datum entspricht wirklich dem gesuchten Hijri-Monat/-Tag", () => {
    const ergebnis = kommendeFeiertage(new Date("2026-01-01"));
    for (const f of ergebnis) {
      const hijri = toHijri(f.datum);
      expect(hijri.monat).toBe(f.hijriMonat);
      expect(hijri.tag).toBe(f.hijriTag);
    }
  });

  it("liefert chronologisch aufsteigend sortierte Termine", () => {
    const ergebnis = kommendeFeiertage(new Date("2026-01-01"));
    for (let i = 1; i < ergebnis.length; i++) {
      expect(ergebnis[i].datum.getTime()).toBeGreaterThanOrEqual(ergebnis[i - 1].datum.getTime());
    }
  });

  it("liegt jeder Termin in der Zukunft (ab dem übergebenen Datum)", () => {
    const ab = new Date("2026-01-01");
    const ergebnis = kommendeFeiertage(ab);
    for (const f of ergebnis) {
      expect(f.datum.getTime()).toBeGreaterThanOrEqual(ab.getTime());
    }
  });
});
