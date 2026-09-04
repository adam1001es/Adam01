import { describe, it, expect } from "vitest";
import { fuelleVorlage, ELTERNBRIEF_VORLAGEN, findeElternbriefVorlage } from "./elternbriefe";

describe("findeElternbriefVorlage", () => {
  it("findet eine bestehende Vorlage per id", () => {
    expect(findeElternbriefVorlage("ramadan-infobrief")?.id).toBe("ramadan-infobrief");
  });

  it("liefert null für eine unbekannte id", () => {
    expect(findeElternbriefVorlage("unbekannt")).toBeNull();
  });
});

describe("fuelleVorlage", () => {
  const vorlage = ELTERNBRIEF_VORLAGEN[0];

  it("ersetzt ausgefüllte Felder im Text", () => {
    const gefuellt = fuelleVorlage(vorlage, { lehrkraft: "Frau Yılmaz", schule: "VS Musterstraße" });
    expect(gefuellt.some((a) => a.includes("Frau Yılmaz"))).toBe(true);
    expect(gefuellt.some((a) => a.includes("VS Musterstraße"))).toBe(true);
  });

  it("fällt bei leer gelassenen Feldern auf [Label] zurück", () => {
    const gefuellt = fuelleVorlage(vorlage, {});
    const feldLehrkraft = vorlage.felder.find((f) => f.id === "lehrkraft")!;
    expect(gefuellt.some((a) => a.includes(`[${feldLehrkraft.label}]`))).toBe(true);
  });

  it("enthält keine rohen {{...}}-Platzhalter mehr nach dem Füllen", () => {
    const gefuellt = fuelleVorlage(vorlage, { lehrkraft: "Frau Yılmaz" });
    for (const absatz of gefuellt) {
      expect(absatz).not.toMatch(/\{\{.*\}\}/);
    }
  });
});
