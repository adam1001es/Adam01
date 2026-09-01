import { describe, it, expect } from "vitest";
import { prozentZuNote, AUSTRIA_NOTENSCHLUESSEL, NOTE_LABEL } from "./noten";

describe("prozentZuNote", () => {
  it("ordnet Prozentwerte an den Schlüssel-Grenzen korrekt zu", () => {
    expect(prozentZuNote(100)).toBe(1);
    expect(prozentZuNote(87)).toBe(1);
    expect(prozentZuNote(86.9)).toBe(2);
    expect(prozentZuNote(73)).toBe(2);
    expect(prozentZuNote(72.9)).toBe(3);
    expect(prozentZuNote(59)).toBe(3);
    expect(prozentZuNote(58.9)).toBe(4);
    expect(prozentZuNote(44)).toBe(4);
    expect(prozentZuNote(43.9)).toBe(5);
    expect(prozentZuNote(0)).toBe(5);
  });

  it("klemmt Werte außerhalb von 0-100 statt einen Fehler zu werfen", () => {
    expect(prozentZuNote(-10)).toBe(5);
    expect(prozentZuNote(150)).toBe(1);
  });

  it("NOTE_LABEL deckt jede Note aus AUSTRIA_NOTENSCHLUESSEL ab", () => {
    for (const stufe of AUSTRIA_NOTENSCHLUESSEL) {
      expect(NOTE_LABEL[stufe.note]).toBe(stufe.label);
    }
  });
});
