import { describe, it, expect } from "vitest";
import { schaetzeAufgabenAnzahl } from "./types";

describe("schaetzeAufgabenAnzahl", () => {
  it("liefert 0 ohne ausgewählte Aufgabentypen", () => {
    expect(schaetzeAufgabenAnzahl(35, [], "mittel")).toBe(0);
  });

  it("liefert für unbegrenzte Aufgabentypen einen Wert zwischen 2 und 10", () => {
    const anzahl = schaetzeAufgabenAnzahl(35, ["multiple_choice", "lueckentext"], "mittel");
    expect(anzahl).toBeGreaterThanOrEqual(2);
    expect(anzahl).toBeLessThanOrEqual(10);
  });

  // Regressionstest für einen echten Bug: bei AUSSCHLIESSLICH gedeckelten Aufgabentypen (siehe
  // AUFGABEN_TYP_MAXIMUM) zeigte die Schätzung z.B. "ca. 2 Aufgaben" bei einzig gewähltem
  // "Bildergeschichte" (max. 1 pro Arbeitsblatt) - ein Wert, der serverseitig nie erreicht werden
  // kann (siehe begrenzeAufgabenProTyp in lib/generateWorksheet.ts).
  it("deckelt die Schätzung, wenn ausschließlich Aufgabentypen mit eigener Obergrenze gewählt sind", () => {
    expect(schaetzeAufgabenAnzahl(35, ["kreuzwortraetsel"], "mittel")).toBe(1);
    expect(schaetzeAufgabenAnzahl(50, ["wortsuche"], "anspruchsvoll")).toBe(1);
    expect(schaetzeAufgabenAnzahl(20, ["kreuzwortraetsel"], "einfach")).toBe(1);
  });

  it("summiert die Obergrenzen mehrerer ausschließlich gedeckelter Aufgabentypen", () => {
    // kreuzwortraetsel (max 1) + wortsuche (max 1) = höchstens 2
    expect(
      schaetzeAufgabenAnzahl(50, ["kreuzwortraetsel", "wortsuche"], "mittel"),
    ).toBeLessThanOrEqual(2);
  });

  it("wird NICHT gedeckelt, wenn zusätzlich ein unbegrenzter Aufgabentyp gewählt ist", () => {
    const anzahl = schaetzeAufgabenAnzahl(50, ["kreuzwortraetsel", "multiple_choice"], "mittel");
    expect(anzahl).toBeGreaterThanOrEqual(2);
  });

  it("liefert nie mehr als 10 Aufgaben", () => {
    expect(schaetzeAufgabenAnzahl(500, ["wahr_falsch"], "einfach")).toBe(10);
  });
});
