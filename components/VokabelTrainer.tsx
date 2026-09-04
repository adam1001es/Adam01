"use client";

import { useMemo, useState } from "react";
import { Shuffle, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

interface Vokabel {
  id: string;
  begriff: string;
  arabisch?: string;
  bedeutung: string;
  kontext?: string;
}

/** Mischt eine Kopie des Arrays (Fisher-Yates) - reine Client-Interaktion, kein Server-Call. */
function gemischt<T>(liste: T[]): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

/** Karteikarten-Trainer für islamische Fachbegriffe (siehe app/werkzeuge/vokabeln) - rein
 * clientseitig, kein KI-Aufruf: die Begriffe kommen fertig aus der bereits admin-geprüften
 * Wissensbasis (siehe geprüfteBegriffe in lib/wissensbasis.ts). */
export default function VokabelTrainer({ initialVokabeln }: { initialVokabeln: Vokabel[] }) {
  const [reihenfolge, setReihenfolge] = useState(initialVokabeln);
  const [index, setIndex] = useState(0);
  const [umgedreht, setUmgedreht] = useState(false);

  const aktuelle = reihenfolge[index];
  const fortschritt = useMemo(
    () => `${reihenfolge.length === 0 ? 0 : index + 1} / ${reihenfolge.length}`,
    [index, reihenfolge.length],
  );

  function weiter() {
    setUmgedreht(false);
    setIndex((i) => (i + 1) % reihenfolge.length);
  }

  function zurueck() {
    setUmgedreht(false);
    setIndex((i) => (i - 1 + reihenfolge.length) % reihenfolge.length);
  }

  function mischen() {
    setReihenfolge((r) => gemischt(r));
    setIndex(0);
    setUmgedreht(false);
  }

  if (reihenfolge.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-amber-200 bg-surface p-8 text-center text-slate-500 shadow-card">
        Noch keine geprüften Begriffe in der Wissensbasis vorhanden.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span>{fortschritt}</span>
        <button
          type="button"
          onClick={mischen}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-amber-300 hover:text-amber-700"
        >
          <Shuffle size={13} /> Mischen
        </button>
      </div>

      <button
        type="button"
        onClick={() => setUmgedreht((u) => !u)}
        title="Umdrehen"
        className="flex min-h-[16rem] w-full flex-col items-center justify-center rounded-2xl border border-amber-200 bg-surface p-8 text-center shadow-card-werkzeuge transition hover:shadow-card-werkzeuge-hover"
      >
        {!umgedreht ? (
          <>
            {aktuelle.arabisch && (
              <div className="mb-3 font-display text-4xl text-slate-800" dir="rtl">
                {aktuelle.arabisch}
              </div>
            )}
            <div className="font-display text-2xl font-semibold text-slate-800" dir="auto">
              {aktuelle.begriff}
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-400">
              <RotateCw size={12} /> Zum Umdrehen antippen
            </p>
          </>
        ) : (
          <>
            <p className="text-lg leading-relaxed text-slate-700" dir="auto">
              {aktuelle.bedeutung}
            </p>
            {aktuelle.kontext && (
              <p className="mt-3 text-sm text-slate-400" dir="auto">
                {aktuelle.kontext}
              </p>
            )}
          </>
        )}
      </button>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={zurueck}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-amber-300 hover:text-amber-700"
        >
          <ChevronLeft size={16} /> Zurück
        </button>
        <button
          type="button"
          onClick={weiter}
          className="inline-flex items-center gap-1.5 rounded-full bg-werkzeuge-gradient px-4 py-2 text-sm font-medium text-white shadow-card-werkzeuge transition hover:shadow-card-werkzeuge-hover"
        >
          Weiter <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
