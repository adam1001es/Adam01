import { describe, it, expect } from "vitest";
import { findeUnzulaessigeZeichenaufgaben } from "./darstellungsverbot";
import type { WorksheetContent } from "./types";

function baueContent(fragen: string[]): WorksheetContent {
  return {
    titel: "Test",
    fach: "Islamischer Religionsunterricht",
    schulstufe: "1. Klasse Volksschule",
    thema: "Test",
    lernziel: "Test",
    einleitung: "Test",
    aufgaben: fragen.map((frage, i) => ({
      nr: i + 1,
      typ: "malaufgabe" as const,
      frage,
    })),
    loesungen: fragen.map((_, i) => ({ nr: i + 1, loesung: "Individuelle Zeichnung" })),
    quellen: [],
  };
}

describe("findeUnzulaessigeZeichenaufgaben", () => {
  it("erkennt den tatsächlich aufgetretenen Fall (Engel zeichnen)", () => {
    const content = baueContent([
      "Male dich selbst auf deinem Schulweg. Male neben dich zwei Engel, die auf dich aufpassen.",
    ]);
    const treffer = findeUnzulaessigeZeichenaufgaben(content);
    expect(treffer).toHaveLength(1);
    expect(treffer[0].aufgabeNr).toBe(1);
  });

  it("erkennt eine Zeichenanweisung zum Propheten", () => {
    const content = baueContent(["Zeichne den Propheten, wie er in der Moschee betet."]);
    expect(findeUnzulaessigeZeichenaufgaben(content)).toHaveLength(1);
  });

  it("erkennt eine Zeichenanweisung zu einem Sahabi", () => {
    const content = baueContent(["Male einen Sahabi, der dem Propheten hilft."]);
    expect(findeUnzulaessigeZeichenaufgaben(content)).toHaveLength(1);
  });

  it("erkennt eine Zeichenanweisung zu einem namentlich genannten Propheten (Adam)", () => {
    const content = baueContent(["Zeichne Adam und Hawa im Paradies."]);
    expect(findeUnzulaessigeZeichenaufgaben(content)).toHaveLength(1);
  });

  it("lässt eine erlaubte Zeichenaufgabe (Ort/Gegenstand) unangetastet", () => {
    const content = baueContent(["Male die Moschee, in der die Menschen beten."]);
    expect(findeUnzulaessigeZeichenaufgaben(content)).toHaveLength(0);
  });

  it("lässt eine Nachspurübung zum Wort 'Engel' unangetastet (kein Zeichen-Verb)", () => {
    const content = baueContent(["Fahre das arabische Wort für Engel nach."]);
    expect(findeUnzulaessigeZeichenaufgaben(content)).toHaveLength(0);
  });

  it("meldet nur die betroffene Aufgabe, nicht die unbedenklichen", () => {
    const content = baueContent([
      "Male die Moschee, in der die Menschen beten.",
      "Male dich selbst mit zwei Engeln, die auf dich aufpassen.",
      "Male eine gute Tat, die du heute machst.",
    ]);
    const treffer = findeUnzulaessigeZeichenaufgaben(content);
    expect(treffer).toHaveLength(1);
    expect(treffer[0].aufgabeNr).toBe(2);
  });
});
