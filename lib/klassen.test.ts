import { describe, it, expect } from "vitest";
import {
  berechneAbdeckung,
  berechneSchuelerUebersicht,
  berechneKlassenDurchschnitt,
  berechneSchuelerVerlauf,
} from "./klassen";

describe("berechneAbdeckung", () => {
  it("gruppiert nach Themenbereich und berechnet den Durchschnitt korrekt", () => {
    const ergebnis = berechneAbdeckung([
      {
        themenbereich: "ibada",
        datum: new Date("2026-01-10"),
        ergebnisse: [{ prozent: 80 }, { prozent: 60 }],
      },
      {
        themenbereich: "ibada",
        datum: new Date("2026-02-10"),
        ergebnisse: [{ prozent: 100 }],
      },
      {
        themenbereich: "glaubensbasis",
        datum: new Date("2026-01-05"),
        ergebnisse: [],
      },
    ]);

    const ibada = ergebnis.find((e) => e.themenbereich === "ibada")!;
    expect(ibada.anzahlZuweisungen).toBe(2);
    expect(ibada.durchschnittProzent).toBeCloseTo(80); // (80+60+100)/3
    expect(ibada.letzteZuweisungAm).toEqual(new Date("2026-02-10"));

    const glaubensbasis = ergebnis.find((e) => e.themenbereich === "glaubensbasis")!;
    expect(glaubensbasis.durchschnittProzent).toBeNull();
  });

  it("sortiert nach der festen THEMENBEREICH_KEYS-Reihenfolge, nicht nach Häufigkeit", () => {
    const ergebnis = berechneAbdeckung([
      { themenbereich: "muamalat", datum: new Date(), ergebnisse: [] },
      { themenbereich: "muamalat", datum: new Date(), ergebnisse: [] },
      { themenbereich: "muamalat", datum: new Date(), ergebnisse: [] },
      { themenbereich: "selbsterkenntnis", datum: new Date(), ergebnisse: [] },
    ]);
    expect(ergebnis.map((e) => e.themenbereich)).toEqual(["selbsterkenntnis", "muamalat"]);
  });

  it("liefert eine leere Liste ohne Zuweisungen", () => {
    expect(berechneAbdeckung([])).toEqual([]);
  });
});

describe("berechneSchuelerUebersicht", () => {
  it("berechnet den Durchschnitt pro Schüler und zeigt Schüler ohne Ergebnis mit null", () => {
    const ergebnis = berechneSchuelerUebersicht(
      ["s1", "s2"],
      [
        { schuelerId: "s1", prozent: 90 },
        { schuelerId: "s1", prozent: 70 },
        { schuelerId: "s2", prozent: null },
      ],
    );
    expect(ergebnis).toEqual([
      { schuelerId: "s1", anzahlErgebnisse: 2, durchschnittProzent: 80 },
      { schuelerId: "s2", anzahlErgebnisse: 0, durchschnittProzent: null },
    ]);
  });
});

describe("berechneKlassenDurchschnitt", () => {
  it("mittelt über alle vorhandenen Ergebnisse, ignoriert null-Werte", () => {
    expect(
      berechneKlassenDurchschnitt([{ prozent: 100 }, { prozent: 50 }, { prozent: null }]),
    ).toBe(75);
  });

  it("liefert null ohne Ergebnisse", () => {
    expect(berechneKlassenDurchschnitt([])).toBeNull();
  });
});

describe("berechneSchuelerVerlauf", () => {
  it("filtert auf die eigenen Ergebnisse und sortiert chronologisch aufsteigend", () => {
    const verlauf = berechneSchuelerVerlauf("s1", [
      {
        id: "z2",
        titel: "Zweite Zuweisung",
        datum: new Date("2026-03-01"),
        istPruefung: true,
        ergebnisse: [{ schuelerId: "s1", prozent: 90, notiz: null }],
      },
      {
        id: "z1",
        titel: "Erste Zuweisung",
        datum: new Date("2026-01-01"),
        istPruefung: false,
        ergebnisse: [
          { schuelerId: "s1", prozent: 70, notiz: "gut mitgemacht" },
          { schuelerId: "s2", prozent: 50, notiz: null },
        ],
      },
      {
        id: "z3",
        titel: "Ohne Ergebnis für s1",
        datum: new Date("2026-02-01"),
        istPruefung: false,
        ergebnisse: [{ schuelerId: "s2", prozent: 60, notiz: null }],
      },
    ]);

    expect(verlauf.map((v) => v.zuweisungId)).toEqual(["z1", "z2"]);
    expect(verlauf[0]).toEqual({
      zuweisungId: "z1",
      titel: "Erste Zuweisung",
      datum: new Date("2026-01-01"),
      istPruefung: false,
      prozent: 70,
      notiz: "gut mitgemacht",
    });
  });

  it("nimmt Zuweisungen mit prozent:null auf (erfasst, aber noch nicht benotet)", () => {
    const verlauf = berechneSchuelerVerlauf("s1", [
      {
        id: "z1",
        titel: "Offene Zuweisung",
        datum: new Date("2026-01-01"),
        istPruefung: false,
        ergebnisse: [{ schuelerId: "s1", prozent: null, notiz: null }],
      },
    ]);
    expect(verlauf).toHaveLength(1);
    expect(verlauf[0].prozent).toBeNull();
  });

  it("liefert eine leere Liste ohne passende Ergebnisse", () => {
    expect(berechneSchuelerVerlauf("s1", [])).toEqual([]);
  });
});
