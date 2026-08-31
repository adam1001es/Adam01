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
    expect(schaetzeAufgabenAnzahl(35, ["bildergeschichte"], "mittel")).toBe(1);
    expect(schaetzeAufgabenAnzahl(50, ["bildergeschichte"], "anspruchsvoll")).toBe(1);
    expect(schaetzeAufgabenAnzahl(20, ["kreuzwortraetsel"], "einfach")).toBe(1);
  });

  it("summiert die Obergrenzen mehrerer ausschließlich gedeckelter Aufgabentypen", () => {
    // bildergeschichte (max 1) + kreuzwortraetsel (max 1) + ausmalbild (max 4) = höchstens 6
    expect(
      schaetzeAufgabenAnzahl(50, ["bildergeschichte", "kreuzwortraetsel", "ausmalbild"], "mittel"),
    ).toBeLessThanOrEqual(6);
  });

  it("wird NICHT gedeckelt, wenn zusätzlich ein unbegrenzter Aufgabentyp gewählt ist", () => {
    const anzahl = schaetzeAufgabenAnzahl(50, ["bildergeschichte", "multiple_choice"], "mittel");
    expect(anzahl).toBeGreaterThanOrEqual(2);
  });

  it("liefert nie mehr als 10 Aufgaben", () => {
    expect(schaetzeAufgabenAnzahl(500, ["wahr_falsch"], "einfach")).toBe(10);
  });
});
