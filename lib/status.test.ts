import { describe, it, expect } from "vitest";
import { istGueltigerStatus, NUTZER_STATUS } from "./status";

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
