import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { importiereZitateVonLink } from "./linkImport";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("./anthropic", async () => {
  const actual = await vi.importActual<typeof import("./anthropic")>("./anthropic");
  return {
    ...actual,
    // importiereZitateVonLink ruft client.messages.stream(...).finalMessage() auf (siehe
    // lib/linkImport.ts - hohes max_tokens braucht laut Anthropic-SDK Streaming statt .create()),
    // createMock liefert dieselbe Antwort wie zuvor, nur über den finalMessage()-Umweg.
    getAnthropicClient: () => ({
      messages: {
        stream: (params: unknown) => ({ finalMessage: () => createMock(params) }),
      },
    }),
  };
});

function claudeResponse(text: string, stop_reason: string = "end_turn") {
  return { content: [{ type: "text", text }], stop_reason };
}

describe("importiereZitateVonLink", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
    createMock.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("wirft bei einer ungültigen URL", async () => {
    await expect(importiereZitateVonLink("keine-url")).rejects.toThrow(/Ungültige URL/);
  });

  it("wirft bei einem nicht unterstützten Protokoll", async () => {
    await expect(importiereZitateVonLink("ftp://example.com/datei")).rejects.toThrow(/http/);
  });

  it("wirft, wenn die Seite nicht abgerufen werden kann", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 404 });
    await expect(importiereZitateVonLink("https://example.com/hadith")).rejects.toThrow(/Status 404/);
  });

  it("erklärt bei Status 403 den wahrscheinlichen Bot-Schutz statt nur den Statuscode zu nennen", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 403 });
    await expect(importiereZitateVonLink("https://example.com/hadith")).rejects.toThrow(
      /blockiert automatisierte Abrufe/,
    );
  });

  it("extrahiert ein einzelnes Zitat samt Grundkompetenz-Einordnung aus der Modellantwort", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () =>
        "<html><body><p>Sahih al-Bukhari, Buch 2, Nr. 15: 'Die Taten werden nur nach den Absichten beurteilt.'</p></body></html>",
    });
    createMock.mockResolvedValue(
      claudeResponse(
        JSON.stringify({
          zitate: [
            {
              bezeichnung: "Sahih al-Bukhari, Buch 2, Nr. 15",
              text: "Die Taten werden nur nach den Absichten beurteilt.",
              hinweis: "Als sahih eingestuft.",
              themenbereich: "ibada",
            },
          ],
        }),
      ),
    );

    const ergebnis = await importiereZitateVonLink("https://example.com/hadith");

    expect(ergebnis.abgeschnitten).toBe(false);
    expect(ergebnis.zitate).toEqual([
      {
        bezeichnung: "Sahih al-Bukhari, Buch 2, Nr. 15",
        text: "Die Taten werden nur nach den Absichten beurteilt.",
        hinweis: "Als sahih eingestuft.",
        themenbereich: "ibada",
      },
    ]);
  });

  it("extrahiert mehrere Zitate aus einer Sammelseite (z.B. eine Hadith-Sammlung mit vielen Einträgen)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => "<html><body>40 Hadith An-Nawawi ... viele Einträge ...</body></html>",
    });
    createMock.mockResolvedValue(
      claudeResponse(
        JSON.stringify({
          zitate: [
            { bezeichnung: "40 Hadith An-Nawawi, Hadith 1", text: "Text 1", hinweis: "", themenbereich: "ibada" },
            { bezeichnung: "40 Hadith An-Nawawi, Hadith 2", text: "Text 2", hinweis: "", themenbereich: "glaubensbasis" },
            { bezeichnung: "40 Hadith An-Nawawi, Hadith 3", text: "Text 3", hinweis: "", themenbereich: "muamalat" },
          ],
        }),
      ),
    );

    const ergebnis = await importiereZitateVonLink("https://example.com/40-hadith");

    expect(ergebnis.zitate).toHaveLength(3);
    expect(ergebnis.zitate.map((z) => z.bezeichnung)).toEqual([
      "40 Hadith An-Nawawi, Hadith 1",
      "40 Hadith An-Nawawi, Hadith 2",
      "40 Hadith An-Nawawi, Hadith 3",
    ]);
  });

  it("fällt bei einer unbekannten/fehlenden Grundkompetenz auf 'gemischt' zurück", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => "<html><body>Ein Zitat</body></html>",
    });
    createMock.mockResolvedValue(
      claudeResponse(
        JSON.stringify({
          zitate: [{ bezeichnung: "Quelle", text: "Text", hinweis: "", themenbereich: "unbekannter-wert" }],
        }),
      ),
    );

    const ergebnis = await importiereZitateVonLink("https://example.com/hadith");

    expect(ergebnis.zitate[0].themenbereich).toBe("gemischt");
  });

  it("überspringt Einträge ohne bezeichnung/text statt den ganzen Import fehlschlagen zu lassen", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => "<html><body>Zwei Einträge, einer unvollständig</body></html>",
    });
    createMock.mockResolvedValue(
      claudeResponse(
        JSON.stringify({
          zitate: [
            { bezeichnung: "", text: "Text ohne Bezeichnung", hinweis: "", themenbereich: "ibada" },
            { bezeichnung: "Vollständiger Eintrag", text: "Text", hinweis: "", themenbereich: "ibada" },
          ],
        }),
      ),
    );

    const ergebnis = await importiereZitateVonLink("https://example.com/hadith");

    expect(ergebnis.zitate).toHaveLength(1);
    expect(ergebnis.zitate[0].bezeichnung).toBe("Vollständiger Eintrag");
  });

  it("wirft, wenn auf der Seite kein Zitat erkannt wurde", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => "<html><body>Navigation, keine Inhalte</body></html>",
    });
    createMock.mockResolvedValue(claudeResponse(JSON.stringify({ zitate: [] })));

    await expect(importiereZitateVonLink("https://example.com/leer")).rejects.toThrow(/keine Zitate/);
  });

  it("rettet bei einer wegen max_tokens abgeschnittenen Antwort alle bereits vollständigen Zitate", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => "<html><body>Sehr lange Sammlung mit vielen, langen Hadithen ...</body></html>",
    });
    // Simuliert eine mitten im dritten Objekt abgebrochene Antwort - kein gültiges Gesamt-JSON
    // mehr (schließende Klammern fehlen), aber die ersten zwei Objekte sind vollständig.
    const abgeschnittenerText =
      '{ "zitate": [' +
      '{ "bezeichnung": "Hadith 1", "text": "Text 1", "hinweis": "", "themenbereich": "ibada" }, ' +
      '{ "bezeichnung": "Hadith 2", "text": "Text 2", "hinweis": "", "themenbereich": "glaubensbasis" }, ' +
      '{ "bezeichnung": "Hadith 3", "text": "Text 3, mitten im Satz abgebroch';
    createMock.mockResolvedValue(claudeResponse(abgeschnittenerText, "max_tokens"));

    const ergebnis = await importiereZitateVonLink("https://example.com/lange-sammlung");

    expect(ergebnis.abgeschnitten).toBe(true);
    expect(ergebnis.zitate).toHaveLength(2);
    expect(ergebnis.zitate.map((z) => z.bezeichnung)).toEqual(["Hadith 1", "Hadith 2"]);
  });

  it("wirft trotzdem den 'keine Zitate erkannt'-Fehler, wenn selbst nach Abschneiden nichts Vollständiges übrig bleibt", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => "<html><body>Ein sehr langer, direkt abbrechender Hadith</body></html>",
    });
    createMock.mockResolvedValue(
      claudeResponse('{ "zitate": [{ "bezeichnung": "Hadith 1", "text": "mitten im ersten Objekt abg', "max_tokens"),
    );

    await expect(importiereZitateVonLink("https://example.com/sehr-lang")).rejects.toThrow(/keine Zitate/);
  });
});
