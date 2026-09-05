import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseJahresplanVorlage } from "./jahresplanImport";

// Echte, vom Schulamt der IGGÖ übermittelte Jahresplanungs-Vorlage (Schulbeginn 07.09.2026) als
// Test-Fixture - schützt den Parser gegen stille Regressionen, ohne bei jedem Testlauf eine neue
// Datei hochladen zu müssen. Siehe lib/jahresplanImport.ts für die Hintergründe der Parsing-Logik.
const FIXTURE_PFAD = join(__dirname, "__fixtures__", "jahresplanung-vorlage-2026-09-07.docx");

describe("parseJahresplanVorlage", () => {
  it("liest alle 43 Wochen über beide Semester", async () => {
    const buffer = readFileSync(FIXTURE_PFAD);
    const { wochen, warnungen } = await parseJahresplanVorlage(buffer);
    expect(wochen).toHaveLength(43);
    expect(warnungen).toHaveLength(0);
    expect(wochen.filter((w) => w.semester === 1)).toHaveLength(22);
    expect(wochen.filter((w) => w.semester === 2)).toHaveLength(21);
    // Fortlaufend nummeriert, keine Lücken/Duplikate.
    expect(wochen.map((w) => w.nummer)).toEqual(Array.from({ length: 43 }, (_, i) => i + 1));
  });

  it("liest Woche 1 (Schulbeginn) korrekt inkl. Hijri-Datum", async () => {
    const buffer = readFileSync(FIXTURE_PFAD);
    const { wochen } = await parseJahresplanVorlage(buffer);
    const woche1 = wochen.find((w) => w.nummer === 1)!;
    expect(woche1.semester).toBe(1);
    expect(woche1.von).toBe("2026-09-07");
    expect(woche1.bis).toBe("2026-09-13");
    expect(woche1.hijri).toBe("25. Rabi al-Awwal – 2. Rabi al-Achir 1448");
    expect(woche1.anmerkungen).toEqual(["Schulbeginn: 07.09.2026"]);
  });

  it("löst den Jahreswechsel Dezember->Jänner korrekt auf", async () => {
    const buffer = readFileSync(FIXTURE_PFAD);
    const { wochen } = await parseJahresplanVorlage(buffer);
    // Die Weihnachtsferien-Woche, die tatsächlich über den Jahreswechsel läuft - "von" muss im
    // Vorjahr liegen, "bis" im neuen Jahr (andere Weihnachtsferien-Wochen liegen komplett in einem
    // der beiden Jahre und sind hier nicht der Testfall).
    const jahreswechselWoche = wochen.find((w) => w.von.startsWith("2026-12") && w.bis.startsWith("2027-01"));
    expect(jahreswechselWoche).toBeDefined();
    expect(jahreswechselWoche!.anmerkungen.some((a) => a.includes("Weihnachtsferien"))).toBe(true);
  });

  it("dedupliziert Feiertage, die in Wochenthema- UND Anmerkung-Spalte stehen (Ramadanfest)", async () => {
    const buffer = readFileSync(FIXTURE_PFAD);
    const { wochen } = await parseJahresplanVorlage(buffer);
    const ramadanfestWoche = wochen.find((w) => w.anmerkungen.some((a) => a.includes("Ramadanfest (1. Tag)")));
    expect(ramadanfestWoche).toBeDefined();
    const ramadanfestEintraege = ramadanfestWoche!.anmerkungen.filter((a) => a.includes("Ramadanfest"));
    // Jeder Ramadanfest-Tag genau EINMAL, nicht doppelt (Vorlage listet ihn sowohl in der
    // Wochenthema- als auch der Anmerkung-Spalte, siehe Modul-Kommentar in jahresplanImport.ts).
    expect(ramadanfestEintraege).toHaveLength(3);
    expect(new Set(ramadanfestEintraege).size).toBe(3);
  });

  it("liest die letzte Woche (Sommerferien) korrekt", async () => {
    const buffer = readFileSync(FIXTURE_PFAD);
    const { wochen } = await parseJahresplanVorlage(buffer);
    const letzteWoche = wochen[wochen.length - 1];
    expect(letzteWoche.nummer).toBe(43);
    expect(letzteWoche.anmerkungen.some((a) => a.includes("Sommerferien"))).toBe(true);
  });

  it("wirft einen aussagekräftigen Fehler bei einer Nicht-docx-Datei", async () => {
    await expect(parseJahresplanVorlage(Buffer.from("kein docx"))).rejects.toThrow();
  });
});
