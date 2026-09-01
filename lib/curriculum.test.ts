import { describe, it, expect } from "vitest";
import {
  guessSchulstufenCluster,
  istFrueheVolksschulstufe,
  holeSchulstufenThemen,
  SCHULSTUFE_THEMEN,
  SCHULSTUFE_THEMEN_VORSCHULE,
} from "./curriculum";

describe("guessSchulstufenCluster", () => {
  it("erkennt Volksschule an der Bezeichnung", () => {
    expect(guessSchulstufenCluster("2. Klasse Volksschule").id).toBe("volksschule");
  });

  it("erkennt Volksschule an reiner Zahl 1-4", () => {
    expect(guessSchulstufenCluster("3. Schulstufe").id).toBe("volksschule");
  });

  it("erkennt Sekundarstufe I an Mittelschule/Unterstufe", () => {
    expect(guessSchulstufenCluster("2. Klasse Mittelschule/AHS-Unterstufe (6. Schulstufe)").id).toBe(
      "sek1",
    );
  });

  it("erkennt Polytechnische Schule", () => {
    expect(guessSchulstufenCluster("Polytechnische Schule (9. Schulstufe)").id).toBe("poly");
  });

  // Regressionstest für einen echten Bug: die AHS-interne Klassenzahl (5.-8. Klasse) liegt
  // zufällig immer <= 8, genau wie die Sekundarstufe-I-Schwelle - ohne Vorrang der expliziten
  // "(N. Schulstufe)"-Angabe wurden ALLE VIER AHS-Oberstufe-Optionen fälschlich als
  // Sekundarstufe I statt II eingestuft (mit entsprechend zu einfacher Komplexitätsvorgabe für
  // die Generierung, siehe SCHULSTUFEN_CLUSTER-Hinweistexte).
  it("erkennt alle vier AHS-Oberstufe-Optionen korrekt als Sekundarstufe II, nicht I", () => {
    expect(guessSchulstufenCluster("5. Klasse AHS-Oberstufe/BMHS (9. Schulstufe)").id).toBe("sek2");
    expect(guessSchulstufenCluster("6. Klasse AHS-Oberstufe/BMHS (10. Schulstufe)").id).toBe(
      "sek2",
    );
    expect(guessSchulstufenCluster("7. Klasse AHS-Oberstufe/BMHS (11. Schulstufe)").id).toBe(
      "sek2",
    );
    expect(guessSchulstufenCluster("8. Klasse AHS-Oberstufe/BMHS (12. Schulstufe)").id).toBe(
      "sek2",
    );
  });

  it("erkennt Berufsschule", () => {
    expect(guessSchulstufenCluster("Berufsschule").id).toBe("berufsschule");
  });

  it("fällt bei unbekanntem Text auf die mittlere Komplexitätsstufe (sek1) zurück", () => {
    expect(guessSchulstufenCluster("irgendein Freitext ohne Zahl").id).toBe("sek1");
  });
});

describe("istFrueheVolksschulstufe", () => {
  // Nur die 1. Klasse gilt als "früh" (formaler Erstlese-/Erstschreibunterricht beginnt zwar
  // sofort, echte Lese-/Schreibfähigkeit entwickelt sich aber erst im Schuljahr) - die 2. Klasse
  // gilt bewusst als regulär, da die meisten Kinder dann schon funktional lese-/schreibfähig
  // sind (auch wenn noch nicht geübt).
  it("ist true für die 1. Klasse Volksschule", () => {
    expect(istFrueheVolksschulstufe("1. Klasse Volksschule")).toBe(true);
  });

  it("ist false ab der 2. Klasse Volksschule", () => {
    expect(istFrueheVolksschulstufe("2. Klasse Volksschule")).toBe(false);
    expect(istFrueheVolksschulstufe("3. Klasse Volksschule")).toBe(false);
    expect(istFrueheVolksschulstufe("4. Klasse Volksschule")).toBe(false);
  });

  it("ist false außerhalb der Volksschule, auch bei niedriger Zahl", () => {
    expect(istFrueheVolksschulstufe("1. Klasse Mittelschule/AHS-Unterstufe (5. Schulstufe)")).toBe(
      false,
    );
  });
});

describe("holeSchulstufenThemen", () => {
  it("liefert die Vorschul-Themen für 'Vorschule'", () => {
    expect(holeSchulstufenThemen("Vorschule")).toBe(SCHULSTUFE_THEMEN_VORSCHULE);
  });

  it("liefert die passenden Themen über eine explizite 'N. Schulstufe'-Angabe", () => {
    expect(holeSchulstufenThemen("6. Klasse AHS-Oberstufe/BMHS (10. Schulstufe)")).toBe(
      SCHULSTUFE_THEMEN[10],
    );
  });

  it("liefert die passenden Themen für Volksschul-Klassenangaben ohne 'Schulstufe'-Wort", () => {
    expect(holeSchulstufenThemen("3. Klasse Volksschule")).toBe(SCHULSTUFE_THEMEN[3]);
  });

  it("liefert die Themen der 9. Schulstufe für Polytechnische Schule", () => {
    expect(holeSchulstufenThemen("Polytechnische Schule (9. Schulstufe)")).toBe(
      SCHULSTUFE_THEMEN[9],
    );
  });

  it("liefert null bei nicht auflösbarem Text", () => {
    expect(holeSchulstufenThemen("irgendein Freitext ohne Zahl")).toBeNull();
  });
});
