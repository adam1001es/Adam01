"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileEdit, ListChecks, BookMarked, Plus, Trash2, Save } from "lucide-react";
import { WorksheetContent, Aufgabe, Quelle } from "@/lib/types";
import { ANFORDERUNGSBEREICHE, ANFORDERUNGSBEREICHE_KEYS, AnforderungsbereichKey } from "@/lib/curriculum";
import SectionCard from "@/components/SectionCard";
import { inputClass, labelClass } from "@/lib/formStyles";

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

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
    >
      <Plus size={14} strokeWidth={2.5} />
      {children}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700"
    >
      <Trash2 size={13} /> Entfernen
    </button>
  );
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionCard icon={FileEdit} title="Kopfdaten">
        <label className="mb-4 block">
          <span className={labelClass}>Titel</span>
          <input
            className={inputClass}
            value={content.titel}
            onChange={(e) => setContent((c) => ({ ...c, titel: e.target.value }))}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Fach</span>
            <input
              className={inputClass}
              value={content.fach}
              onChange={(e) => setContent((c) => ({ ...c, fach: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Schulstufe</span>
            <input
              className={inputClass}
              value={content.schulstufe}
              onChange={(e) => setContent((c) => ({ ...c, schulstufe: e.target.value }))}
            />
          </label>
        </div>
        <label className="mt-4 block">
          <span className={labelClass}>Thema</span>
          <input
            className={inputClass}
            value={content.thema}
            onChange={(e) => setContent((c) => ({ ...c, thema: e.target.value }))}
          />
        </label>
        <label className="mt-4 block">
          <span className={labelClass}>Lernziel</span>
          <textarea
            className={inputClass}
            rows={2}
            value={content.lernziel}
            onChange={(e) => setContent((c) => ({ ...c, lernziel: e.target.value }))}
          />
        </label>
        <label className="mt-4 block">
          <span className={labelClass}>Einleitung</span>
          <textarea
            className={inputClass}
            rows={3}
            value={content.einleitung}
            onChange={(e) => setContent((c) => ({ ...c, einleitung: e.target.value }))}
          />
        </label>
      </SectionCard>

      <SectionCard
        icon={ListChecks}
        title="Aufgaben & Lösungen"
        action={<AddButton onClick={addAufgabe}>Aufgabe hinzufügen</AddButton>}
      >
        <div className="space-y-5">
          {content.aufgaben.map((a) => (
            <div key={a.nr} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {a.nr}. {TYP_LABEL[a.typ]}
                </span>
                <RemoveButton onClick={() => removeAufgabe(a.nr)} />
              </div>
              <label className="mb-3 block max-w-sm">
                <span className={labelClass}>Anforderungsbereich</span>
                <select
                  className={inputClass}
                  value={a.anforderungsbereich ?? ""}
                  onChange={(e) =>
                    updateAufgabe(a.nr, {
                      anforderungsbereich: (e.target.value || undefined) as
                        | AnforderungsbereichKey
                        | undefined,
                    })
                  }
                >
                  <option value="">— nicht gesetzt —</option>
                  {ANFORDERUNGSBEREICHE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {ANFORDERUNGSBEREICHE[key].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mb-3 block">
                <span className={labelClass}>Frage</span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={a.frage}
                  onChange={(e) => updateAufgabe(a.nr, { frage: e.target.value })}
                />
              </label>

              {a.typ === "multiple_choice" && (
                <div className="mb-3">
                  <span className={labelClass}>Optionen</span>
                  {(a.optionen ?? []).map((opt, i) => (
                    <input
                      key={i}
                      className={`${inputClass} mb-1.5`}
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
                <div className="mb-3 space-y-1.5">
                  <span className={labelClass}>Zuordnungspaare</span>
                  {(a.zuordnungLinks ?? []).map((left, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={`${inputClass} w-1/2`}
                        value={left}
                        onChange={(e) => {
                          const zuordnungLinks = [...(a.zuordnungLinks ?? [])];
                          zuordnungLinks[i] = e.target.value;
                          updateAufgabe(a.nr, { zuordnungLinks });
                        }}
                      />
                      <input
                        className={`${inputClass} w-1/2`}
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
                <label className="mb-3 block">
                  <span className={labelClass}>Wortliste (durch Komma getrennt)</span>
                  <input
                    className={inputClass}
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
                <span className={labelClass}>Lösung</span>
                <textarea
                  className={inputClass}
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
      </SectionCard>

      <SectionCard
        icon={BookMarked}
        title="Quellenangaben"
        action={<AddButton onClick={addQuelle}>Quelle hinzufügen</AddButton>}
      >
        <div className="space-y-3">
          {content.quellen.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Quelle {i + 1}
                </span>
                <RemoveButton onClick={() => removeQuelle(i)} />
              </div>
              <input
                className={`${inputClass} mb-2.5`}
                placeholder="Bezeichnung, z.B. Sahih al-Bukhari, ..."
                value={q.bezeichnung}
                onChange={(e) => updateQuelle(i, { bezeichnung: e.target.value })}
              />
              <input
                className={`${inputClass} mb-2.5`}
                placeholder="Zitat/Wortlaut (optional)"
                value={q.text ?? ""}
                onChange={(e) => updateQuelle(i, { text: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <span className="text-slate-600">Status:</span>
                <select
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
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
      </SectionCard>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 font-medium text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
        >
          <Save size={17} />
          {saving ? "Wird gespeichert …" : "Änderungen speichern"}
        </button>
        <a
          href={`/worksheet/${worksheetId}`}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300"
        >
          Abbrechen
        </a>
      </div>
    </form>
  );
}
