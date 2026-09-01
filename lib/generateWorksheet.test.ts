import { describe, it, expect } from "vitest";
import { normalisierePruefungspunkte } from "./generateWorksheet";
import type { WorksheetContent } from "./types";

function baueContent(punkte: (number | undefined)[]): WorksheetContent {
  return {
    titel: "Test",
    fach: "Islamischer Religionsunterricht",
    schulstufe: "5. Klasse AHS-Oberstufe/BMHS (9. Schulstufe)",
    thema: "Test",
    lernziel: "Test",
    einleitung: "Test",
    aufgaben: punkte.map((p, i) => ({
      nr: i + 1,
      typ: "offene_frage" as const,
      frage: `Frage ${i + 1}`,
      punkte: p,
    })),
    loesungen: punkte.map((_, i) => ({ nr: i + 1, loesung: "x" })),
    quellen: [],
  };
}

describe("normalisierePruefungspunkte", () => {
  it("lässt eine bereits korrekte Punktesumme unverändert (bis auf Rundung)", () => {
    const content = baueContent([5, 10, 5]);
    normalisierePruefungspunkte(content, 20);
    expect(content.aufgaben.map((a) => a.punkte)).toEqual([5, 10, 5]);
  });

  it("skaliert eine falsche Punktesumme proportional auf die Zielpunktzahl", () => {
    const content = baueContent([1, 2, 1]);
    normalisierePruefungspunkte(content, 20);
    const summe = content.aufgaben.reduce((s, a) => s + (a.punkte ?? 0), 0);
    expect(summe).toBe(20);
    // Aufgabe 2 hatte ursprünglich doppelt so viele Punkte wie 1/3 - soll weiterhin am höchsten gewichtet sein
    expect(content.aufgaben[1].punkte).toBeGreaterThan(content.aufgaben[0].punkte!);
  });

  it("verteilt gleichmäßig, wenn keine Aufgabe Punkte hat", () => {
    const content = baueContent([undefined, undefined, undefined, undefined]);
    normalisierePruefungspunkte(content, 10);
    const summe = content.aufgaben.reduce((s, a) => s + (a.punkte ?? 0), 0);
    expect(summe).toBe(10);
    expect(content.aufgaben.every((a) => (a.punkte ?? 0) >= 2)).toBe(true);
  });

  it("jede Aufgabe behält mindestens 1 Punkt, auch wenn die Zielpunktzahl knapp über der Aufgabenzahl liegt", () => {
    const content = baueContent([1, 1, 1, 1]);
    normalisierePruefungspunkte(content, 5);
    const summe = content.aufgaben.reduce((s, a) => s + (a.punkte ?? 0), 0);
    expect(summe).toBe(5);
    expect(content.aufgaben.every((a) => (a.punkte ?? 0) >= 1)).toBe(true);
  });

  it("macht nichts bei leerer Aufgabenliste", () => {
    const content = baueContent([]);
    expect(() => normalisierePruefungspunkte(content, 20)).not.toThrow();
  });
});
