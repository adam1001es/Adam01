import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatiereKoranZitat,
  gleicheQuellenMitKoranApiAb,
  buildKoranFokusSystemContext,
  holeAlleSuren,
  type QuranVers,
} from "./quranApi";
import type { WorksheetContent, Quelle } from "./types";

function baueContent(quellen: Quelle[]): WorksheetContent {
  return {
    titel: "Test",
    fach: "Islamischer Religionsunterricht",
    schulstufe: "5. Klasse AHS-Oberstufe/BMHS (9. Schulstufe)",
    thema: "Test",
    lernziel: "Test",
    einleitung: "Test",
    aufgaben: [],
    loesungen: [],
    quellen,
  };
}

function mockAyahResponse(sureNummer: number, versNummer: number, arabisch: string, deutsch: string) {
  const surah = { number: sureNummer, name: "البقرة", englishName: "Al-Baqarah", englishNameTranslation: "The Cow" };
  return {
    code: 200,
    status: "OK",
    data: [
      { text: arabisch, surah, numberInSurah: versNummer },
      { text: deutsch, surah, numberInSurah: versNummer },
    ],
  };
}

describe("formatiereKoranZitat", () => {
  const vers255: QuranVers = {
    sureNummer: 2,
    sureNameTransliteriert: "Al-Baqarah",
    versNummer: 255,
    arabisch: "arab. 255",
    deutsch: "255. Allah - es gibt keinen Gott außer Ihm...",
  };
  const vers256: QuranVers = {
    ...vers255,
    versNummer: 256,
    arabisch: "arab. 256",
    deutsch: "256. Es gibt keinen Zwang im Glauben...",
  };

  it("formatiert einen einzelnen Vers", () => {
    const { bezeichnung, text } = formatiereKoranZitat([vers255]);
    expect(bezeichnung).toBe("Sure 2 (Al-Baqarah), Vers 255");
    expect(text).toBe(vers255.deutsch);
  });

  it("formatiert einen Versbereich", () => {
    const { bezeichnung, text } = formatiereKoranZitat([vers255, vers256]);
    expect(bezeichnung).toBe("Sure 2 (Al-Baqarah), Verse 255-256");
    expect(text).toBe(`${vers255.deutsch} ${vers256.deutsch}`);
  });
});

describe("buildKoranFokusSystemContext", () => {
  it("enthält Bezeichnung, arabischen und deutschen Text, sowie die Anweisung zur exakten Übernahme", () => {
    const vers: QuranVers = {
      sureNummer: 112,
      sureNameTransliteriert: "Al-Ikhlas",
      versNummer: 1,
      arabisch: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      deutsch: "1. Sag: Er ist Allah, ein Einziger.",
    };
    const context = buildKoranFokusSystemContext([vers]);

    expect(context).toContain("Sure 112 (Al-Ikhlas), Vers 1");
    expect(context).toContain(vers.arabisch);
    expect(context).toContain(vers.deutsch);
    expect(context).toContain('"sicherheit": "gesichert"');
  });
});

describe("holeAlleSuren", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("mappt die API-Felder auf die deutschen Feldnamen", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 200,
        status: "OK",
        data: [
          { number: 1, name: "الفاتحة", englishName: "Al-Faatiha", englishNameTranslation: "The Opening", numberOfAyahs: 7 },
          { number: 114, name: "الناس", englishName: "An-Naas", englishNameTranslation: "Mankind", numberOfAyahs: 6 },
        ],
      }),
    });

    const suren = await holeAlleSuren();

    expect(suren).toEqual([
      { nummer: 1, nameArabisch: "الفاتحة", nameTransliteriert: "Al-Faatiha", bedeutung: "The Opening", verseAnzahl: 7 },
      { nummer: 114, nameArabisch: "الناس", nameTransliteriert: "An-Naas", bedeutung: "Mankind", verseAnzahl: 6 },
    ]);
  });

  it("wirft bei einem Netzwerkfehler eine verständliche Fehlermeldung", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("down"));
    await expect(holeAlleSuren()).rejects.toThrow(/Netzwerkfehler/);
  });

  it("wiederholt einmal bei einem 429 (Rate-Limit) und liefert bei Erfolg im zweiten Versuch das Ergebnis", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 200,
          status: "OK",
          data: [
            { number: 1, name: "الفاتحة", englishName: "Al-Faatiha", englishNameTranslation: "The Opening", numberOfAyahs: 7 },
          ],
        }),
      });

    const suren = await holeAlleSuren();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(suren).toEqual([
      { nummer: 1, nameArabisch: "الفاتحة", nameTransliteriert: "Al-Faatiha", bedeutung: "The Opening", verseAnzahl: 7 },
    ]);
  });

  it("gibt nach einem zweiten 429 in Folge eine verständliche Überlastungs-Meldung zurück statt es endlos zu versuchen", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    await expect(holeAlleSuren()).rejects.toThrow(/überlastet/);
  });
});

describe("gleicheQuellenMitKoranApiAb", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("ersetzt Bezeichnung/Text einer erkannten Koran-Quelle durch den API-Text und markiert 'gesichert'", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockAyahResponse(2, 255, "arab. 255", "255. Allah - der wahrhaftige Text."),
    });
    const content = baueContent([
      { bezeichnung: "Koran, Sure 2, Vers 255", text: "irgendein von Claude erinnerter Text", sicherheit: "gesichert" },
    ]);

    await gleicheQuellenMitKoranApiAb(content);

    expect(content.quellen[0].text).toBe("255. Allah - der wahrhaftige Text.");
    expect(content.quellen[0].bezeichnung).toBe("Sure 2 (Al-Baqarah), Vers 255");
    expect(content.quellen[0].sicherheit).toBe("gesichert");
  });

  it("erkennt auch die Doppelpunkt-Schreibweise 'Sure X:Y'", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockAyahResponse(2, 255, "arab. 255", "255. Text."),
    });
    const content = baueContent([{ bezeichnung: "Sure 2:255", sicherheit: "bitte_pruefen" }]);

    await gleicheQuellenMitKoranApiAb(content);

    expect(content.quellen[0].sicherheit).toBe("gesichert");
  });

  it("stuft eine Quelle auf 'bitte_pruefen' herunter, wenn der Vers laut API nicht existiert (erfundene Angabe)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    const content = baueContent([
      { bezeichnung: "Koran, Sure 2, Vers 9999", text: "erfundener Text", sicherheit: "gesichert" },
    ]);

    await gleicheQuellenMitKoranApiAb(content);

    expect(content.quellen[0].sicherheit).toBe("bitte_pruefen");
  });

  it("stuft eine Quelle bei einem Netzwerkfehler ebenfalls auf 'bitte_pruefen' herunter statt 'gesichert' zu belassen", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"));
    const content = baueContent([
      { bezeichnung: "Koran, Sure 2, Vers 255", text: "Text", sicherheit: "gesichert" },
    ]);

    await gleicheQuellenMitKoranApiAb(content);

    expect(content.quellen[0].sicherheit).toBe("bitte_pruefen");
  });

  it("lässt Hadith- und andere Nicht-Koran-Quellen unangetastet, da sie kein Sure/Vers-Muster enthalten", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    const content = baueContent([
      { bezeichnung: "Sahih al-Bukhari, Buch 2, Nr. 15", text: "Ein Hadith-Text", sicherheit: "gesichert" },
    ]);

    await gleicheQuellenMitKoranApiAb(content);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(content.quellen[0]).toEqual({
      bezeichnung: "Sahih al-Bukhari, Buch 2, Nr. 15",
      text: "Ein Hadith-Text",
      sicherheit: "gesichert",
    });
  });

  it("lässt eine Koran-Angabe ohne konkrete Versnummer (z.B. ganze Sure) unangetastet", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    const content = baueContent([{ bezeichnung: "Koran, Sure Al-Fatiha", sicherheit: "gesichert" }]);

    await gleicheQuellenMitKoranApiAb(content);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(content.quellen[0].sicherheit).toBe("gesichert");
  });
});
