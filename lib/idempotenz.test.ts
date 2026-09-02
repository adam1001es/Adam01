import { describe, it, expect } from "vitest";
import { berechneRequestHash } from "./idempotenz";
import type { GenerateRequest } from "./types";

function baueRequest(overrides: Partial<GenerateRequest> = {}): GenerateRequest {
  return {
    bereich: "Islamischer Religionsunterricht",
    thema: "Halal oder haram",
    schulstufe: "3. Klasse Mittelschule/AHS-Unterstufe (7. Schulstufe)",
    themenbereich: "gemischt",
    inhaltsquelle: "frei",
    ausgabeform: "arbeitsblatt",
    zieldauerMinuten: 30,
    komplexitaet: "mittel",
    aufgabentypen: ["multiple_choice", "wahr_falsch"],
    istPruefung: false,
    layout: {
      template: "klassisch",
      schriftgroesse: "normal",
      zeigeIslamischesDatum: true,
      zeigeMuster: true,
      musterVariante: "sterne",
      zeigeLernziel: false,
      farbmodus: "schwarzweiss",
    },
    ...overrides,
  };
}

describe("berechneRequestHash", () => {
  it("liefert für identische Einstellungen denselben Hash", () => {
    const a = berechneRequestHash(baueRequest(), "user-1");
    const b = berechneRequestHash(baueRequest(), "user-1");
    expect(a).toBe(b);
  });

  it("liefert für eine geänderte Schulstufe einen anderen Hash", () => {
    const a = berechneRequestHash(baueRequest(), "user-1");
    const b = berechneRequestHash(baueRequest({ schulstufe: "3. Klasse Volksschule" }), "user-1");
    expect(a).not.toBe(b);
  });

  it("ist unabhängig von der Reihenfolge der Aufgabentypen (gleiche Auswahl = gleicher Hash)", () => {
    const a = berechneRequestHash(baueRequest({ aufgabentypen: ["multiple_choice", "wahr_falsch"] }), "user-1");
    const b = berechneRequestHash(baueRequest({ aufgabentypen: ["wahr_falsch", "multiple_choice"] }), "user-1");
    expect(a).toBe(b);
  });

  it("liefert für unterschiedliche Nutzer einen anderen Hash bei sonst identischen Einstellungen", () => {
    const a = berechneRequestHash(baueRequest(), "user-1");
    const b = berechneRequestHash(baueRequest(), "user-2");
    expect(a).not.toBe(b);
  });

  it("liefert für einen unterschiedlichen Koran-Fokus einen anderen Hash", () => {
    const a = berechneRequestHash(baueRequest(), "user-1");
    const b = berechneRequestHash(
      baueRequest({ koranFokus: { sureNummer: 78, vonVers: 1, bisVers: 20 } }),
      "user-1",
    );
    expect(a).not.toBe(b);
  });
});
