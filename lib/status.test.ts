import { describe, it, expect } from "vitest";
import { istGueltigerStatus, istKuerzlichAktiv, NUTZER_STATUS } from "./status";

describe("istGueltigerStatus", () => {
  it("akzeptiert alle definierten Status-Werte", () => {
    for (const s of NUTZER_STATUS) {
      expect(istGueltigerStatus(s)).toBe(true);
    }
  });

  it("lehnt unbekannte Werte ab", () => {
    expect(istGueltigerStatus("abwesend")).toBe(false);
    expect(istGueltigerStatus("")).toBe(false);
    expect(istGueltigerStatus("Online")).toBe(false); // Groß-/Kleinschreibung ist relevant
  });
});

describe("istKuerzlichAktiv", () => {
  it("lehnt null ab (noch nie aktiv)", () => {
    expect(istKuerzlichAktiv(null)).toBe(false);
  });

  it("akzeptiert einen Zeitpunkt vor weniger als 3 Minuten", () => {
    const vorEinerMinute = new Date(Date.now() - 60 * 1000);
    expect(istKuerzlichAktiv(vorEinerMinute)).toBe(true);
  });

  it("lehnt einen Zeitpunkt vor mehr als 3 Minuten ab", () => {
    const vorZehnMinuten = new Date(Date.now() - 10 * 60 * 1000);
    expect(istKuerzlichAktiv(vorZehnMinuten)).toBe(false);
  });
});
