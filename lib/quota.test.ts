import { describe, it, expect } from "vitest";
import {
  istTierAktiv,
  istZahlendesKonto,
  aktuellerZyklusStart,
  bildLimitFuer,
  enthaeltBildAufgabe,
  zaehleGenerierteBilder,
  tierLabel,
  TIER_BILD_QUOTA,
  KOSTENLOS_BILD_LIMIT,
} from "./quota";

describe("istTierAktiv", () => {
  it("ist false ohne tier", () => {
    expect(istTierAktiv(null, null, null)).toBe(false);
  });

  it("ist true bei gesetztem tier ohne Gültigkeitszeitraum", () => {
    expect(istTierAktiv("starter", null, null)).toBe(true);
  });

  it("ist false vor tierGueltigVon", () => {
    const jetzt = new Date("2026-06-15");
    const von = new Date("2026-09-01");
    expect(istTierAktiv("starter", von, null, jetzt)).toBe(false);
  });

  it("ist false nach tierGueltigBis", () => {
    const jetzt = new Date("2026-09-15");
    const bis = new Date("2026-06-30");
    expect(istTierAktiv("starter", null, bis, jetzt)).toBe(false);
  });

  it("ist true innerhalb des Gültigkeitszeitraums", () => {
    const jetzt = new Date("2026-07-15");
    const von = new Date("2026-06-01");
    const bis = new Date("2026-12-31");
    expect(istTierAktiv("starter", von, bis, jetzt)).toBe(true);
  });
});

describe("istZahlendesKonto", () => {
  it("Admin ist immer zahlend, auch ohne tier", () => {
    expect(istZahlendesKonto({ role: "admin", tier: null })).toBe(true);
  });

  it("Nutzerkonto ohne tier ist nicht zahlend", () => {
    expect(istZahlendesKonto({ role: "user", tier: null })).toBe(false);
  });

  it("Nutzerkonto mit aktivem tier ist zahlend", () => {
    expect(istZahlendesKonto({ role: "user", tier: "pro" })).toBe(true);
  });

  it("Nutzerkonto mit abgelaufenem tierGueltigBis ist nicht zahlend", () => {
    const abgelaufen = new Date("2020-01-01");
    expect(
      istZahlendesKonto({ role: "user", tier: "starter", tierGueltigBis: abgelaufen }),
    ).toBe(false);
  });
});

describe("aktuellerZyklusStart", () => {
  it("liefert das Kontoerstellungsdatum als Start, wenn noch kein voller Zyklus vergangen ist", () => {
    const erstellt = new Date();
    erstellt.setDate(erstellt.getDate() - 5);
    const start = aktuellerZyklusStart(erstellt);
    expect(start.getTime()).toBe(erstellt.getTime());
  });

  it("springt nach einem vollen 30-Tage-Zyklus auf den nächsten Zyklusstart", () => {
    const erstellt = new Date();
    erstellt.setDate(erstellt.getDate() - 35);
    const start = aktuellerZyklusStart(erstellt);
    const erwarteterStart = new Date(erstellt);
    erwarteterStart.setDate(erwarteterStart.getDate() + 30);
    expect(start.getTime()).toBe(erwarteterStart.getTime());
  });
});

describe("bildLimitFuer", () => {
  it("liefert 0 (KOSTENLOS_BILD_LIMIT) ohne tier", () => {
    expect(bildLimitFuer(null)).toBe(KOSTENLOS_BILD_LIMIT);
  });

  it("liefert das jeweilige Tier-Limit", () => {
    expect(bildLimitFuer("starter")).toBe(TIER_BILD_QUOTA.starter);
    expect(bildLimitFuer("pro")).toBe(TIER_BILD_QUOTA.pro);
  });

  it("liefert 0 für ein unbekanntes tier statt undefined", () => {
    expect(bildLimitFuer("unbekannt")).toBe(0);
  });
});

describe("enthaeltBildAufgabe", () => {
  it("erkennt ausmalbild-Aufgaben", () => {
    const json = JSON.stringify({ aufgaben: [{ typ: "ausmalbild" }] });
    expect(enthaeltBildAufgabe(json)).toBe(true);
  });

  it("erkennt bildergeschichte-Aufgaben", () => {
    const json = JSON.stringify({ aufgaben: [{ typ: "bildergeschichte" }] });
    expect(enthaeltBildAufgabe(json)).toBe(true);
  });

  it("ist false bei reinen Text-Aufgaben", () => {
    const json = JSON.stringify({ aufgaben: [{ typ: "offene_frage" }, { typ: "lueckentext" }] });
    expect(enthaeltBildAufgabe(json)).toBe(false);
  });

  it("ist defensiv false bei kaputtem JSON statt zu werfen", () => {
    expect(enthaeltBildAufgabe("das ist kein JSON")).toBe(false);
  });
});

describe("zaehleGenerierteBilder", () => {
  it("zählt bildGeneriertId auf Aufgaben-Ebene", () => {
    const json = JSON.stringify({
      aufgaben: [{ bildGeneriertId: "a" }, { bildGeneriertId: "b" }, {}],
    });
    expect(zaehleGenerierteBilder(json)).toBe(2);
  });

  it("zählt bildGeneriertId auch innerhalb von bildergeschichteSchritte", () => {
    const json = JSON.stringify({
      aufgaben: [
        {
          bildergeschichteSchritte: [{ bildGeneriertId: "a" }, { bildGeneriertId: "b" }, {}],
        },
      ],
    });
    expect(zaehleGenerierteBilder(json)).toBe(2);
  });

  it("ist defensiv 0 bei kaputtem JSON statt zu werfen", () => {
    expect(zaehleGenerierteBilder("kaputt")).toBe(0);
  });
});

describe("tierLabel", () => {
  it("liefert das Gratis-Label ohne tier", () => {
    expect(tierLabel(null)).toMatch(/Kostenlos/);
  });

  it("liefert das jeweilige Tier-Label", () => {
    expect(tierLabel("starter")).toMatch(/Starter/);
    expect(tierLabel("pro")).toMatch(/Pro/);
  });
});
