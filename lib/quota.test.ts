import { describe, it, expect } from "vitest";
import {
  istTierAktiv,
  istZahlendesKonto,
  aktuellerZyklusStart,
  zaehleGenerierteBilder,
  tierLabel,
  formatEur,
  TIER_QUOTA,
  TIER_PREIS_EUR,
  GESCHAETZTE_KOSTEN_TEXT_PRO_BLATT_EUR,
} from "./quota";

describe("formatEur", () => {
  // Regressionstest für einen echten Bug: (3.5).toFixed(2) liefert "3.50" mit Punkt statt des im
  // Deutschen/Österreichischen üblichen Kommas - stand so unbemerkt an mehreren Stellen im Code.
  it("nutzt ein Komma statt eines Punkts als Dezimaltrenner", () => {
    expect(formatEur(3.5)).toBe("3,50");
    expect(formatEur(2)).toBe("2,00");
    expect(formatEur(0.1)).toBe("0,10");
  });
});

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

describe("Abo-Kalkulation - Mindestmarge bei voller Ausschöpfung", () => {
  // Regressionstest für die Preis-/Kontingent-Entscheidung: bei voller Nutzung des monatlichen
  // Kontingents (Worst Case) soll die Marge nie unter die vereinbarte Untergrenze fallen, sonst
  // zahlt der Betreiber bei intensiv nutzenden Konten drauf.
  const MINDESTMARGE = 0.25;

  it("hält für das Abo mindestens 25% Marge im Worst Case", () => {
    const kosten = TIER_QUOTA.pro * GESCHAETZTE_KOSTEN_TEXT_PRO_BLATT_EUR;
    const marge = (TIER_PREIS_EUR.pro - kosten) / TIER_PREIS_EUR.pro;
    expect(marge).toBeGreaterThanOrEqual(MINDESTMARGE);
  });

  it("hält den Abwärtskompatibilitäts-Alias 'starter' auf identischen Werten wie 'pro'", () => {
    expect(TIER_QUOTA.starter).toBe(TIER_QUOTA.pro);
    expect(TIER_PREIS_EUR.starter).toBe(TIER_PREIS_EUR.pro);
  });
});

describe("tierLabel", () => {
  it("liefert das Gratis-Label ohne tier", () => {
    expect(tierLabel(null)).toMatch(/Kostenlos/);
  });

  it("liefert für 'pro' und den Abwärtskompatibilitäts-Alias 'starter' dasselbe Abo-Label", () => {
    expect(tierLabel("pro")).toMatch(/Abo/);
    expect(tierLabel("starter")).toBe(tierLabel("pro"));
  });
});
