"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorksheetContent, Aufgabe, Quelle } from "@/lib/types";

const TYP_LABEL: Record<Aufgabe["typ"], string> = {
  multiple_choice: "Multiple Choice",
  lueckentext: "Lückentext",
  zuordnung: "Zuordnung",
  offene_frage: "Offene Frage",
  wahr_falsch: "Wahr oder Falsch",
};

function naechsteNr(aufgaben: Aufgabe[]): number {
  return aufgaben.reduce((max, a) => Math.max(max, a.nr), 0) + 1;
}

export default function EditWorksheetForm({
  worksheetId,
  initialContent,
}: {
  worksheetId: string;
  initialContent: WorksheetContent;
}) {
  const router = useRouter();
  const [content, setContent] = useState<WorksheetContent>(initialContent);
  const [loesungenByNr, setLoesungenByNr] = useState<Record<number, string>>(
    Object.fromEntries(initialContent.loesungen.map((l) => [l.nr, l.loesung])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateAufgabe(nr: number, patch: Partial<Aufgabe>) {
    setContent((c) => ({
      ...c,
      aufgaben: c.aufgaben.map((a) => (a.nr === nr ? { ...a, ...patch } : a)),
    }));
  }

  function removeAufgabe(nr: number) {
    setContent((c) => ({ ...c, aufgaben: c.aufgaben.filter((a) => a.nr !== nr) }));
    setLoesungenByNr((l) => {
      const rest = { ...l };
      delete rest[nr];
      return rest;
    });
  }

  function addAufgabe() {
    const nr = naechsteNr(content.aufgaben);
    setContent((c) => ({
      ...c,
      aufgaben: [...c.aufgaben, { nr, typ: "offene_frage", frage: "" }],
    }));
    setLoesungenByNr((l) => ({ ...l, [nr]: "" }));
  }

  function updateQuelle(index: number, patch: Partial<Quelle>) {
    setContent((c) => ({
      ...c,
      quellen: c.quellen.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
  }

  function removeQuelle(index: number) {
    setContent((c) => ({ ...c, quellen: c.quellen.filter((_, i) => i !== index) }));
  }

  function addQuelle() {
    setContent((c) => ({
      ...c,
      quellen: [...c.quellen, { bezeichnung: "", sicherheit: "bitte_pruefen" }],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const finalContent: WorksheetContent = {
      ...content,
      loesungen: content.aufgaben.map((a) => ({
        nr: a.nr,
        loesung: loesungenByNr[a.nr] ?? "",
      })),
    };

    try {
      const res = await fetch(`/api/worksheet/${worksheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalContent),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      }
      router.push(`/worksheet/${worksheetId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Kopfdaten</h2>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Titel</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={content.titel}
            onChange={(e) => setContent((c) => ({ ...c, titel: e.target.value }))}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Fach</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={content.fach}
              onChange={(e) => setContent((c) => ({ ...c, fach: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Schulstufe</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={content.schulstufe}
              onChange={(e) => setContent((c) => ({ ...c, schulstufe: e.target.value }))}
            />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">Thema</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={content.thema}
            onChange={(e) => setContent((c) => ({ ...c, thema: e.target.value }))}
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">Lernziel</span>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            rows={2}
            value={content.lernziel}
            onChange={(e) => setContent((c) => ({ ...c, lernziel: e.target.value }))}
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">Einleitung</span>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            rows={3}
            value={content.einleitung}
            onChange={(e) => setContent((c) => ({ ...c, einleitung: e.target.value }))}
          />
        </label>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Aufgaben &amp; Lösungen</h2>
          <button
            type="button"
            onClick={addAufgabe}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:border-brand-500"
          >
            + Aufgabe hinzufügen
          </button>
        </div>
        <div className="space-y-5">
          {content.aufgaben.map((a) => (
            <div key={a.nr} className="rounded-md border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {a.nr}. {TYP_LABEL[a.typ]}
                </span>
                <button
                  type="button"
                  onClick={() => removeAufgabe(a.nr)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Entfernen
                </button>
              </div>
              <label className="mb-2 block">
                <span className="mb-1 block text-sm font-medium">Frage</span>
                <textarea
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  rows={2}
                  value={a.frage}
                  onChange={(e) => updateAufgabe(a.nr, { frage: e.target.value })}
                />
              </label>

              {a.typ === "multiple_choice" && (
                <div className="mb-2">
                  <span className="mb-1 block text-sm font-medium">Optionen</span>
                  {(a.optionen ?? []).map((opt, i) => (
                    <input
                      key={i}
                      className="mb-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={opt}
                      onChange={(e) => {
                        const optionen = [...(a.optionen ?? [])];
                        optionen[i] = e.target.value;
                        updateAufgabe(a.nr, { optionen });
                      }}
                    />
                  ))}
                </div>
              )}

              {a.typ === "zuordnung" && (
                <div className="mb-2 space-y-1">
                  <span className="mb-1 block text-sm font-medium">Zuordnungspaare</span>
                  {(a.zuordnungLinks ?? []).map((left, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="w-1/2 rounded-md border border-slate-300 px-3 py-2"
                        value={left}
                        onChange={(e) => {
                          const zuordnungLinks = [...(a.zuordnungLinks ?? [])];
                          zuordnungLinks[i] = e.target.value;
                          updateAufgabe(a.nr, { zuordnungLinks });
                        }}
                      />
                      <input
                        className="w-1/2 rounded-md border border-slate-300 px-3 py-2"
                        value={a.zuordnungRechts?.[i] ?? ""}
                        onChange={(e) => {
                          const zuordnungRechts = [...(a.zuordnungRechts ?? [])];
                          zuordnungRechts[i] = e.target.value;
                          updateAufgabe(a.nr, { zuordnungRechts });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {a.typ === "lueckentext" && (
                <label className="mb-2 block">
                  <span className="mb-1 block text-sm font-medium">
                    Wortliste (durch Komma getrennt)
                  </span>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                    value={(a.wortliste ?? []).join(", ")}
                    onChange={(e) => {
                      const wortliste = e.target.value
                        .split(",")
                        .map((w) => w.trim())
                        .filter((w) => w.length > 0);
                      updateAufgabe(a.nr, { wortliste });
                    }}
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Lösung</span>
                <textarea
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  rows={2}
                  value={loesungenByNr[a.nr] ?? ""}
                  onChange={(e) =>
                    setLoesungenByNr((l) => ({ ...l, [a.nr]: e.target.value }))
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Quellenangaben</h2>
          <button
            type="button"
            onClick={addQuelle}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:border-brand-500"
          >
            + Quelle hinzufügen
          </button>
        </div>
        <div className="space-y-3">
          {content.quellen.map((q, i) => (
            <div key={i} className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-400">Quelle {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeQuelle(i)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Entfernen
                </button>
              </div>
              <input
                className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="Bezeichnung, z.B. Sahih al-Bukhari, ..."
                value={q.bezeichnung}
                onChange={(e) => updateQuelle(i, { bezeichnung: e.target.value })}
              />
              <input
                className="mb-2 w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="Zitat/Wortlaut (optional)"
                value={q.text ?? ""}
                onChange={(e) => updateQuelle(i, { text: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <span>Status:</span>
                <select
                  className="rounded-md border border-slate-300 px-2 py-1"
                  value={q.sicherheit}
                  onChange={(e) =>
                    updateQuelle(i, { sicherheit: e.target.value as Quelle["sicherheit"] })
                  }
                >
                  <option value="gesichert">gesichert</option>
                  <option value="bitte_pruefen">bitte prüfen</option>
                </select>
              </label>
            </div>
          ))}
          {content.quellen.length === 0 && (
            <p className="text-sm text-slate-400">Keine Quellenangaben vorhanden.</p>
          )}
        </div>
      </section>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Wird gespeichert …" : "Änderungen speichern"}
        </button>
        <a
          href={`/worksheet/${worksheetId}`}
          className="rounded-md border border-slate-300 px-4 py-3 text-sm hover:border-slate-400"
        >
          Abbrechen
        </a>
      </div>
    </form>
  );
}
