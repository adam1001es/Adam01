import { describe, it, expect } from "vitest";
import {
  fuelleVorlage,
  absaetzeZuText,
  textZuAbsaetze,
  ISLAMISCHER_GRUSS,
  ELTERNBRIEF_VORLAGEN,
  findeElternbriefVorlage,
} from "./elternbriefe";

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

  it("stellt den islamischen Gruß nur bei islamischerGruss=true voran", () => {
    expect(fuelleVorlage(vorlage, {}, false)[0]).not.toBe(ISLAMISCHER_GRUSS);
    expect(fuelleVorlage(vorlage, {}, true)[0]).toBe(ISLAMISCHER_GRUSS);
  });
});

describe("absaetzeZuText / textZuAbsaetze", () => {
  it("sind zueinander invers (Roundtrip)", () => {
    const absaetze = ["Erster Absatz.", "", "Zweiter Absatz."];
    expect(textZuAbsaetze(absaetzeZuText(absaetze))).toEqual(absaetze);
  });

  it("gibt handbearbeiteten Text unverändert als Absatz-Liste zurück", () => {
    const text = "Eigene erste Zeile.\nEigene zweite Zeile.";
    expect(textZuAbsaetze(text)).toEqual(["Eigene erste Zeile.", "Eigene zweite Zeile."]);
  });
});
