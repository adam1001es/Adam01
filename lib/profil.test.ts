import { describe, it, expect } from "vitest";
import { avatarInitialen, avatarAnzeige, istGueltigesAvatarKuerzel } from "./profil";

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

describe("avatarAnzeige", () => {
  it("nutzt das manuelle Kürzel, wenn gesetzt - unabhängig vom Benutzernamen", () => {
    expect(avatarAnzeige("أد", "Adam")).toBe("أد");
    expect(avatarAnzeige("XY", "ahmad.yilmaz")).toBe("XY");
  });

  it("fällt auf avatarInitialen(username) zurück, wenn kein Kürzel gesetzt ist", () => {
    expect(avatarAnzeige(null, "ahmad.yilmaz")).toBe("AY");
    expect(avatarAnzeige("", "ahmad.yilmaz")).toBe("AY");
    expect(avatarAnzeige("   ", "ahmad.yilmaz")).toBe("AY");
  });
});

describe("istGueltigesAvatarKuerzel", () => {
  it("erlaubt 1-3 Buchstaben beliebiger Schrift", () => {
    expect(istGueltigesAvatarKuerzel("A")).toBe(true);
    expect(istGueltigesAvatarKuerzel("AY")).toBe(true);
    expect(istGueltigesAvatarKuerzel("أد")).toBe(true);
    expect(istGueltigesAvatarKuerzel("محمد")).toBe(false); // 4 Buchstaben
  });

  it("lehnt Ziffern, Symbole und leere Eingaben ab", () => {
    expect(istGueltigesAvatarKuerzel("")).toBe(false);
    expect(istGueltigesAvatarKuerzel("A1")).toBe(false);
    expect(istGueltigesAvatarKuerzel("!!")).toBe(false);
  });
});
