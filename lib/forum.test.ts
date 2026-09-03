import { describe, it, expect } from "vitest";
import { enthaeltVerbotenesWort } from "./forum";

describe("enthaeltVerbotenesWort", () => {
  it("erkennt ein verbotenes Wort unabhängig von Groß-/Kleinschreibung", () => {
    expect(enthaeltVerbotenesWort("Das ist ein Arschloch.")).toBe(true);
    expect(enthaeltVerbotenesWort("ARSCHLOCH")).toBe(true);
  });

  it("lässt harmlosen Text unverändert durch", () => {
    expect(enthaeltVerbotenesWort("Wie handhabt ihr die Projektwoche rund um Ramadan?")).toBe(
      false,
    );
  });

  it("prüft an Wortgrenzen, nicht als reine Teilstring-Suche", () => {
    expect(enthaeltVerbotenesWort("Hurenschwein")).toBe(false);
    expect(enthaeltVerbotenesWort("Hure!")).toBe(true);
  });
});
