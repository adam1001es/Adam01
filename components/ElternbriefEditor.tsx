"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { fuelleVorlage, type ElternbriefVorlage } from "@/lib/elternbriefe";
import { inputClass, labelClass } from "@/lib/formStyles";

/** Editor für eine Elternbrief-Vorlage (siehe app/werkzeuge/elternbriefe/[id]) - Felder direkt im
 * Browser ausfüllen, Live-Vorschau, dann als fertig ausgefülltes Word-Dokument herunterladen
 * (POST an die API-Route statt eines einfachen Links, da die ausgefüllten Werte mitgeschickt
 * werden müssen). Kein KI-Aufruf: die Word-Erzeugung ist reines Textersetzen, siehe
 * lib/elternbriefe.ts/lib/elternbriefeDocx.ts. */
export default function ElternbriefEditor({ vorlage }: { vorlage: ElternbriefVorlage }) {
  const [werte, setWerte] = useState<Record<string, string>>({});
  const [wirdHeruntergeladen, setWirdHeruntergeladen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const absaetze = useMemo(() => fuelleVorlage(vorlage, werte), [vorlage, werte]);

  async function herunterladen() {
    setFehler(null);
    setWirdHeruntergeladen(true);
    try {
      const res = await fetch(`/api/werkzeuge/elternbriefe/${vorlage.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(werte),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFehler(data.error ?? "Word-Dokument konnte nicht erstellt werden.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${vorlage.id}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setFehler("Word-Dokument konnte nicht erstellt werden.");
    } finally {
      setWirdHeruntergeladen(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-card sm:p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-slate-800">Angaben</h2>
        <div className="space-y-4">
          {vorlage.felder.map((feld) => (
            <label key={feld.id} className="block">
              <span className={labelClass}>{feld.label}</span>
              <input
                type="text"
                className={inputClass}
                placeholder={feld.platzhalter}
                value={werte[feld.id] ?? ""}
                onChange={(e) => setWerte((w) => ({ ...w, [feld.id]: e.target.value }))}
              />
            </label>
          ))}
        </div>

        {fehler && <p className="mt-4 text-sm text-red-600">{fehler}</p>}

        <button
          type="button"
          onClick={herunterladen}
          disabled={wirdHeruntergeladen}
          className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-werkzeuge-gradient px-4 py-2.5 text-sm font-medium text-white shadow-card-werkzeuge transition hover:shadow-card-werkzeuge-hover disabled:opacity-60"
        >
          <Download size={15} /> {wirdHeruntergeladen ? "Wird erstellt…" : "Als Word herunterladen"}
        </button>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-surface p-5 shadow-card-werkzeuge sm:p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-slate-800">Vorschau</h2>
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          {absaetze.map((absatz, i) =>
            absatz ? <p key={i}>{absatz}</p> : <div key={i} className="h-2" />,
          )}
        </div>
      </div>
    </div>
  );
}
