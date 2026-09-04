import { describe, it, expect } from "vitest";
import { avatarInitialen } from "./profil";

describe("avatarInitialen", () => {
  it("nimmt je einen Buchstaben pro Namensteil bei Punkt/Unterstrich/Bindestrich", () => {
    expect(avatarInitialen("ahmad.yilmaz")).toBe("AY");
    expect(avatarInitialen("ahmad_yilmaz")).toBe("AY");
    expect(avatarInitialen("Ahmad-Yilmaz")).toBe("AY");
  });

  it("nimmt die ersten zwei Buchstaben bei einem einzelnen Namensteil", () => {
    expect(avatarInitialen("lehrerin82")).toBe("LE");
    expect(avatarInitialen("m")).toBe("M");
  });

  it("fällt auf 'LK' zurück, wenn kein Benutzername gesetzt ist", () => {
    expect(avatarInitialen(null)).toBe("LK");
  });

  it("funktioniert auch mit arabischen Benutzernamen (keine Groß-/Kleinschreibung)", () => {
    expect(avatarInitialen("محمد.علي")).toBe("مع");
    expect(avatarInitialen("أحمد")).toBe("أح");
  });
});
