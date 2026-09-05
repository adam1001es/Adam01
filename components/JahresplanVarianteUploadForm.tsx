"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { inputClass, labelClass } from "@/lib/formStyles";
import type { JahresplanKalenderWoche } from "@/lib/jahresplanKalender";

interface EditableWoche {
  nummer: number;
  semester: 1 | 2;
  von: string;
  bis: string;
  hijri: string;
  anmerkungenText: string;
}

function zuEditable(wochen: JahresplanKalenderWoche[]): EditableWoche[] {
  return wochen.map((w) => ({ ...w, anmerkungenText: w.anmerkungen.join("\n") }));
}

/** Zweistufiger Upload einer künftigen Jahresplanungs-Vorlage (siehe Modul-Kommentar in
 * lib/jahresplanImport.ts, warum das automatische Parsen NICHT blind gespeichert wird): Datei
 * hochladen -> Vorschau prüfen/korrigieren -> bestätigen. Vor dem Bestätigen bleibt JEDE Zeile
 * änderbar, damit ein Parsing-Fehler (falsch gelesenes Datum, doppelte Feiertagszeile) hier
 * auffällt und behoben wird, statt unbemerkt in einer offiziellen Dienstpflicht-Dokumentation zu
 * landen. */
export default function JahresplanVarianteUploadForm() {
  const router = useRouter();
  const [datei, setDatei] = useState<File | null>(null);
  const [ladePending, setLadePending] = useState(false);
  const [speicherPending, setSpeicherPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [warnungen, setWarnungen] = useState<string[]>([]);
  const [varianteId, setVarianteId] = useState("");
  const [label, setLabel] = useState("");
  const [schuljahr, setSchuljahr] = useState("");
  const [wochen, setWochen] = useState<EditableWoche[] | null>(null);

  function zuruecksetzen() {
    setDatei(null);
    setWochen(null);
    setWarnungen([]);
    setFehler(null);
  }

  async function hochladen(e: React.FormEvent) {
    e.preventDefault();
    if (!datei) return;
    setFehler(null);
    setLadePending(true);
    const formData = new FormData();
    formData.append("datei", datei);
    const res = await fetch("/api/admin/jahresplan-varianten/vorschau", { method: "POST", body: formData });
    setLadePending(false);
    if (res.ok) {
      const data = await res.json();
      setVarianteId(data.vorschlag.varianteId);
      setLabel(data.vorschlag.label);
      setSchuljahr(data.vorschlag.schuljahr);
      setWochen(zuEditable(data.wochen));
      setWarnungen(data.warnungen ?? []);
    } else {
      const data = await res.json().catch(() => ({}));
      setFehler(data.error ?? "Datei konnte nicht gelesen werden.");
    }
  }

  function zeileAendern(nummer: number, feld: keyof EditableWoche, wert: string) {
    setWochen((z) => z?.map((w) => (w.nummer === nummer ? { ...w, [feld]: wert } : w)) ?? null);
  }

  async function speichern() {
    if (!wochen) return;
    setFehler(null);
    setSpeicherPending(true);
    const res = await fetch("/api/admin/jahresplan-varianten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        varianteId,
        label,
        schuljahr,
        wochen: wochen.map((w) => ({
          nummer: w.nummer,
          semester: w.semester,
          von: w.von,
          bis: w.bis,
          hijri: w.hijri,
          anmerkungen: w.anmerkungenText.split("\n").map((z) => z.trim()).filter((z) => z),
        })),
      }),
    });
    setSpeicherPending(false);
    if (res.ok) {
      zuruecksetzen();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setFehler(data.error ?? "Speichern fehlgeschlagen.");
    }
  }

  if (!wochen) {
    return (
      <form onSubmit={hochladen} className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-card">
        <label className="block">
          <span className={labelClass}>Word-Vorlage des Schulamts der IGGÖ (.docx)</span>
          <input
            type="file"
            accept=".docx"
            onChange={(e) => setDatei(e.target.files?.[0] ?? null)}
            required
            className={inputClass}
          />
        </label>
        {fehler && <p className="mt-2 text-sm text-red-600">{fehler}</p>}
        <button
          type="submit"
          disabled={!datei || ladePending}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-werkzeuge-gradient px-4 py-2 text-sm font-medium text-white shadow-card-werkzeuge disabled:opacity-60"
        >
          <Upload size={15} /> {ladePending ? "Wird gelesen…" : "Datei lesen"}
        </button>
      </form>
    );
  }

  return (
    <div>
      {warnungen.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Beim Lesen aufgefallen - bitte prüfen:</p>
            <ul className="mt-1 list-inside list-disc">
              {warnungen.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-surface p-5 shadow-card sm:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Kennung (varianteId)</span>
          <input type="text" value={varianteId} onChange={(e) => setVarianteId(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Bezeichnung</span>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Schuljahr</span>
          <input type="text" value={schuljahr} onChange={(e) => setSchuljahr(e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={speichern}
          disabled={speicherPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-werkzeuge-gradient px-4 py-2 text-sm font-medium text-white shadow-card-werkzeuge disabled:opacity-60"
        >
          <Save size={15} /> {speicherPending ? "Speichert…" : `${wochen.length} Wochen speichern`}
        </button>
        <button
          type="button"
          onClick={zuruecksetzen}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:border-amber-300 hover:text-amber-700"
        >
          <RotateCcw size={15} /> Andere Datei wählen
        </button>
        {fehler && <span className="text-sm text-red-600">{fehler}</span>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="w-10 border-b border-slate-200 p-2">#</th>
              <th className="w-28 border-b border-slate-200 p-2">Von</th>
              <th className="w-28 border-b border-slate-200 p-2">Bis</th>
              <th className="w-48 border-b border-slate-200 p-2">Hijri</th>
              <th className="border-b border-slate-200 p-2">Anmerkungen (eine Zeile je Eintrag)</th>
            </tr>
          </thead>
          <tbody>
            {wochen.map((w) => (
              <tr key={w.nummer} className="align-top odd:bg-white even:bg-slate-50/50">
                <td className="border-b border-slate-100 p-2 text-xs font-semibold text-slate-500">
                  {w.nummer}
                  <div className="font-normal text-slate-400">S{w.semester}</div>
                </td>
                <td className="border-b border-slate-100 p-1.5">
                  <input
                    type="date"
                    value={w.von}
                    onChange={(e) => zeileAendern(w.nummer, "von", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-1.5 py-1 text-xs"
                  />
                </td>
                <td className="border-b border-slate-100 p-1.5">
                  <input
                    type="date"
                    value={w.bis}
                    onChange={(e) => zeileAendern(w.nummer, "bis", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-1.5 py-1 text-xs"
                  />
                </td>
                <td className="border-b border-slate-100 p-1.5">
                  <input
                    type="text"
                    value={w.hijri}
                    onChange={(e) => zeileAendern(w.nummer, "hijri", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-1.5 py-1 text-xs"
                  />
                </td>
                <td className="border-b border-slate-100 p-1.5">
                  <textarea
                    value={w.anmerkungenText}
                    onChange={(e) => zeileAendern(w.nummer, "anmerkungenText", e.target.value)}
                    rows={Math.max(1, w.anmerkungenText.split("\n").length)}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-transparent px-1.5 py-1 text-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
