"use client";

import { useMemo, useState } from "react";
import { Shuffle, Printer, Minus, Plus } from "lucide-react";

/** Mischt eine Kopie des Arrays (Fisher-Yates) - reine Client-Interaktion, kein Server-Call. */
function gemischt<T>(liste: T[]): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

const MIN_SPALTEN = 2;
const MAX_SPALTEN = 8;

/** Sitzplan-Generator (siehe app/werkzeuge/sitzplan/[klasseId]) - rein clientseitig, kein
 * Server-Call: die Schüler-Kürzel kommen fertig als Prop, jede Neu-Mischung/Spaltenänderung
 * passiert nur im Browser. Nichts wird gespeichert (bewusst kein eigenes Prisma-Modell für eine
 * einfache Sitzordnung) - beim Neuladen der Seite startet die Anordnung wieder von vorn. */
export default function SitzplanGenerator({ schuelerLabels }: { schuelerLabels: string[] }) {
  const [spalten, setSpalten] = useState(4);
  const [reihenfolge, setReihenfolge] = useState(schuelerLabels);

  const zeilen = useMemo(() => {
    const chunks: string[][] = [];
    for (let i = 0; i < reihenfolge.length; i += spalten) {
      chunks.push(reihenfolge.slice(i, i + spalten));
    }
    return chunks;
  }, [reihenfolge, spalten]);

  if (schuelerLabels.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-amber-200 bg-surface p-8 text-center text-slate-500 shadow-card">
        Diese Klasse hat noch keine erfassten Schüler:innen.
      </p>
    );
  }

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Spalten</span>
          <button
            type="button"
            onClick={() => setSpalten((s) => Math.max(MIN_SPALTEN, s - 1))}
            disabled={spalten <= MIN_SPALTEN}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-300 hover:text-amber-700 disabled:opacity-40"
          >
            <Minus size={14} />
          </button>
          <span className="w-4 text-center text-sm font-medium text-slate-700">{spalten}</span>
          <button
            type="button"
            onClick={() => setSpalten((s) => Math.min(MAX_SPALTEN, s + 1))}
            disabled={spalten >= MAX_SPALTEN}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-300 hover:text-amber-700 disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReihenfolge((r) => gemischt(r))}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-amber-300 hover:text-amber-700"
          >
            <Shuffle size={14} /> Neu mischen
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full bg-werkzeuge-gradient px-3.5 py-2 text-sm font-medium text-white shadow-card-werkzeuge transition hover:shadow-card-werkzeuge-hover"
          >
            <Printer size={14} /> Drucken
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-surface p-5 shadow-card-werkzeuge sm:p-6">
        <div className="mb-4 rounded-lg bg-amber-50 py-2 text-center text-xs font-medium uppercase tracking-wide text-amber-700">
          Tafel
        </div>
        <div className="space-y-3">
          {zeilen.map((zeile, zi) => (
            <div key={zi} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${spalten}, minmax(0, 1fr))` }}>
              {zeile.map((label, si) => (
                <div
                  key={`${zi}-${si}`}
                  className="flex aspect-[4/3] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2 text-center font-display text-sm font-semibold text-slate-700"
                  dir="auto"
                >
                  {label}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
