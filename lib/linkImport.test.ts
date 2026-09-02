import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { importiereZitatVonLink } from "./linkImport";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("./anthropic", async () => {
  const actual = await vi.importActual<typeof import("./anthropic")>("./anthropic");
  return {
    ...actual,
    getAnthropicClient: () => ({ messages: { create: createMock } }),
  };
});

function claudeResponse(text: string) {
  return { content: [{ type: "text", text }] };
}

describe("importiereZitatVonLink", () => {
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
    await expect(importiereZitatVonLink("keine-url")).rejects.toThrow(/Ungültige URL/);
  });

  it("wirft bei einem nicht unterstützten Protokoll", async () => {
    await expect(importiereZitatVonLink("ftp://example.com/datei")).rejects.toThrow(/http/);
  });

  it("wirft, wenn die Seite nicht abgerufen werden kann", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 404 });
    await expect(importiereZitatVonLink("https://example.com/hadith")).rejects.toThrow(/Status 404/);
  });

  it("extrahiert Bezeichnung/Text/Hinweis aus der Modellantwort", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () =>
        "<html><body><p>Sahih al-Bukhari, Buch 2, Nr. 15: 'Die Taten werden nur nach den Absichten beurteilt.'</p></body></html>",
    });
    createMock.mockResolvedValue(
      claudeResponse(
        JSON.stringify({
          gefunden: true,
          bezeichnung: "Sahih al-Bukhari, Buch 2, Nr. 15",
          text: "Die Taten werden nur nach den Absichten beurteilt.",
          hinweis: "Als sahih eingestuft.",
        }),
      ),
    );

    const ergebnis = await importiereZitatVonLink("https://example.com/hadith");

    expect(ergebnis).toEqual({
      bezeichnung: "Sahih al-Bukhari, Buch 2, Nr. 15",
      text: "Die Taten werden nur nach den Absichten beurteilt.",
      hinweis: "Als sahih eingestuft.",
    });
  });

  it("wirft, wenn auf der Seite kein Zitat erkannt wurde", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => "<html><body>Navigation, keine Inhalte</body></html>",
    });
    createMock.mockResolvedValue(
      claudeResponse(JSON.stringify({ gefunden: false, bezeichnung: "", text: "", hinweis: "" })),
    );

    await expect(importiereZitatVonLink("https://example.com/leer")).rejects.toThrow(/kein Zitat/);
  });
});
