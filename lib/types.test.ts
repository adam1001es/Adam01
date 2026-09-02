import { describe, it, expect } from "vitest";
import { schaetzeAufgabenAnzahl, GenerateRequestSchema, AUFGABEN_TYP_MAXIMUM } from "./types";

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

function baseRequest(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    bereich: "Islamischer Religionsunterricht",
    thema: "Die 5 Säulen des Islam",
    schulstufe: "4. Klasse Volksschule",
    aufgabentypen: ["multiple_choice"],
    layout: {},
    ...overrides,
  };
}

describe("GenerateRequestSchema - malaufgabe/recherche_auftrag sind für jede Schulstufe wählbar", () => {
  // "malaufgabe" (Schüler:innen zeichnen selbst) und "recherche_auftrag" (eigenständige
  // Recherche) sind zwar in erster Linie für 1. Klasse Volksschule bzw. ab Sekundarstufe I
  // gedacht (siehe Empfehlungs-Hinweise im Erstellen-Formular), es gibt dafür aber bewusst KEINE
  // harte serverseitige Sperre - die Lehrkraft soll frei wählen können, statt am Absenden mit
  // einem Validierungsfehler auszusteigen (siehe Kommentar bei GenerateRequestSchema).
  it("akzeptiert 'malaufgabe' unabhängig von der Schulstufe", () => {
    const req = baseRequest({ schulstufe: "4. Klasse Volksschule", aufgabentypen: ["malaufgabe"] });
    expect(GenerateRequestSchema.safeParse(req).success).toBe(true);
  });

  it("akzeptiert 'recherche_auftrag' unabhängig von der Schulstufe", () => {
    const req = baseRequest({ schulstufe: "2. Klasse Volksschule", aufgabentypen: ["recherche_auftrag"] });
    expect(GenerateRequestSchema.safeParse(req).success).toBe(true);
  });
});

describe("GenerateRequestSchema - nicht mehr für NEUE Arbeitsblätter wählbare Typen", () => {
  // "diskussion" (rein mündlich, nicht schriftlich bewertbar) und "wortsuche"/"kreuzwortraetsel"
  // (pädagogisch dünn) wurden aus AUFGABEN_TYPEN_AKTIV entfernt (siehe Kommentar dort) -
  // "recherche_auftrag" wurde ebenfalls kurzzeitig entfernt, dann aber zurückgeholt (siehe
  // Kommentar bei AUFGABEN_TYPEN_AKTIV) und bleibt daher wählbar. Bestehende Arbeitsblätter mit
  // den weiterhin entfernten Typen bleiben gültig (siehe AUFGABEN_TYPEN), nur eine NEUE Anfrage
  // damit wird abgelehnt.
  it.each(["diskussion", "wortsuche", "kreuzwortraetsel"])(
    "lehnt '%s' für neue Arbeitsblätter ab",
    (typ) => {
      const req = baseRequest({ aufgabentypen: [typ] });
      expect(GenerateRequestSchema.safeParse(req).success).toBe(false);
    },
  );
});

describe("AUFGABEN_TYP_MAXIMUM", () => {
  it("deckelt 'recherche_auftrag' wie Kreuzworträtsel/Wortsuche auf 1 pro Arbeitsblatt", () => {
    expect(AUFGABEN_TYP_MAXIMUM.recherche_auftrag).toBe(1);
  });

  it("deckelt 'sortierkarten' ebenfalls auf 1 pro Arbeitsblatt", () => {
    expect(AUFGABEN_TYP_MAXIMUM.sortierkarten).toBe(1);
  });
});

describe("GenerateRequestSchema - neue Aufgabentypen für 1. Klasse (bewegungsaufgabe/sortierkarten/nachspuruebung)", () => {
  it("akzeptiert 'bewegungsaufgabe', 'sortierkarten' und 'nachspuruebung'", () => {
    const req = baseRequest({
      schulstufe: "1. Klasse Volksschule",
      aufgabentypen: ["bewegungsaufgabe", "sortierkarten", "nachspuruebung"],
    });
    expect(GenerateRequestSchema.safeParse(req).success).toBe(true);
  });
});
