import { describe, it, expect } from "vitest";
import { vereinfacheArabischeTransliteration } from "./transliteration";

// Regressionstest für einen echten Bug: die PDF-Standardschriften (WinAnsi-Kodierung, kein
// registrierter Custom-Font, siehe lib/pdf/WorksheetPdf.tsx) stellen akademische IPA-Diakritika
// als falsche Zufallszeichen dar - z.B. wurde "ṣadaqa jāriya" als "badaqa jriya" gedruckt,
// "ḥisāb" als "$isb", "Al-Mu'minūn" als "Al-Mu¾minkn". Diese Testfälle sind exakt die im echten
// generierten Arbeitsblatt beobachteten Begriffe.
describe("vereinfacheArabischeTransliteration", () => {
  it("ersetzt Makren, Unterpunkte und Ayn/Hamza durch ASCII-Entsprechungen", () => {
    expect(vereinfacheArabischeTransliteration("rūḥ")).toBe("ruh");
    expect(vereinfacheArabischeTransliteration("ṣadaqa jāriya")).toBe("sadaqa jariya");
    expect(vereinfacheArabischeTransliteration("ḥisāb")).toBe("hisab");
    expect(vereinfacheArabischeTransliteration("ba'th")).toBe("ba'th");
    expect(vereinfacheArabischeTransliteration("ṣalāt al-janāza")).toBe("salat al-janaza");
    expect(vereinfacheArabischeTransliteration("farḍ kifāya")).toBe("fard kifaya");
    expect(vereinfacheArabischeTransliteration("taklīf")).toBe("taklif");
  });

  it("ersetzt ʿAyn/Hamza-Modifier-Buchstaben durch einen normalen geraden Apostroph", () => {
    expect(vereinfacheArabischeTransliteration("Baʿth")).toBe("Ba'th");
    expect(vereinfacheArabischeTransliteration("Al-Muʾminūn")).toBe("Al-Mu'minun");
  });

  it("lässt normalen Text (ohne Diakritika) unverändert", () => {
    expect(vereinfacheArabischeTransliteration("Barzakh")).toBe("Barzakh");
    expect(vereinfacheArabischeTransliteration("Musa (as) vor dem Pharao")).toBe(
      "Musa (as) vor dem Pharao",
    );
  });

  it("wendet die Ersetzung rekursiv auf ALLE String-Werte eines verschachtelten Objekts an", () => {
    const eingabe = {
      titel: "Barzakh",
      aufgaben: [{ frage: "Was bedeutet ṣadaqa jāriya?", optionen: ["ḥisāb", "normal"] }],
    };
    expect(vereinfacheArabischeTransliteration(eingabe)).toEqual({
      titel: "Barzakh",
      aufgaben: [{ frage: "Was bedeutet sadaqa jariya?", optionen: ["hisab", "normal"] }],
    });
  });
});
