"use client";

import { useState } from "react";
import { BookOpenText, ChevronRight, ChevronLeft } from "lucide-react";
import { MAX_VERSE_PRO_ABFRAGE, type SurahMeta, type QuranVers } from "@/lib/quranApi";
import { inputClass, labelClass } from "@/lib/formStyles";

/** Den KOMPLETTEN Koran direkt durchsuchen/lesen - live von der Al-Quran-Cloud-API (Arabisch +
 * deutsche Übersetzung von Bubenheim & Elyas), für jede Lehrkraft frei nutzbar, kein
 * Admin-Freigabe-Schritt nötig (im Unterschied zu den unten gelisteten geprüften Zitaten): der
 * Korantext selbst ist keine zu prüfende Behauptung, sondern ein direkter, live abgerufener
 * Wortlaut aus einer lizenzierten Quelle. Bewusst in 20er-Blöcken (siehe
 * MAX_VERSE_PRO_ABFRAGE) statt ganzer Suren auf einmal - manche Suren haben 200+ Verse, "Weiter"
 * blättert einfach zum nächsten Block innerhalb derselben Sure. */
export default function KoranDurchsuchen({ suren }: { suren: SurahMeta[] }) {
  const [sureNummer, setSureNummer] = useState(1);
  const [von, setVon] = useState(1);
  const [ergebnis, setErgebnis] = useState<QuranVers[] | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const sure = suren.find((s) => s.nummer === sureNummer);
  const bis = sure ? Math.min(von + MAX_VERSE_PRO_ABFRAGE - 1, sure.verseAnzahl) : von;

  async function laden(neuerVon: number) {
    setLaedt(true);
    setFehler(null);
    try {
      const neuesBis = sure ? Math.min(neuerVon + MAX_VERSE_PRO_ABFRAGE - 1, sure.verseAnzahl) : neuerVon;
      const params = new URLSearchParams({
        sure: String(sureNummer),
        von: String(neuerVon),
        bis: String(neuesBis),
      });
      const res = await fetch(`/api/koran/lesen?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Abruf fehlgeschlagen.");
      setVon(neuerVon);
      setErgebnis(data.verse);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Abruf fehlgeschlagen.");
    } finally {
      setLaedt(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-surface p-5 shadow-card-werkzeuge sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-800">
        <BookOpenText size={18} strokeWidth={2} /> Koran durchsuchen
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Der komplette Koran, live abgerufen (Arabisch + deutsche Übersetzung von Bubenheim &amp;
        Elyas) - keine Freigabe nötig, direkt lesbar.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className={labelClass}>Sure</span>
          <select
            className={`${inputClass} w-64`}
            value={sureNummer}
            onChange={(e) => {
              setSureNummer(Number(e.target.value));
              setVon(1);
              setErgebnis(null);
            }}
          >
            {suren.map((s) => (
              <option key={s.nummer} value={s.nummer}>
                {s.nummer}. {s.nameTransliteriert} ({s.verseAnzahl} Verse)
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => laden(1)}
          disabled={laedt}
          className="rounded-lg bg-werkzeuge-gradient px-4 py-2.5 text-sm font-medium text-white shadow-card-werkzeuge disabled:opacity-60"
        >
          {laedt ? "Lädt…" : "Anzeigen"}
        </button>
      </div>

      {fehler && <p className="mt-3 text-sm text-red-600">{fehler}</p>}

      {ergebnis && (
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
          {ergebnis.map((v) => (
            <div key={v.versNummer}>
              <p dir="rtl" className="text-right text-lg leading-relaxed text-slate-800">
                {v.arabisch}
              </p>
              <p className="mt-0.5 text-sm text-slate-700">
                {v.versNummer}. {v.deutsch}
              </p>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => laden(Math.max(1, von - MAX_VERSE_PRO_ABFRAGE))}
              disabled={laedt || von <= 1}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-amber-700 disabled:opacity-40"
            >
              <ChevronLeft size={15} /> Zurück
            </button>
            <span className="text-xs text-slate-400">
              Verse {von}–{bis}
              {sure ? ` von ${sure.verseAnzahl}` : ""}
            </span>
            <button
              type="button"
              onClick={() => laden(von + MAX_VERSE_PRO_ABFRAGE)}
              disabled={laedt || !sure || bis >= sure.verseAnzahl}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-amber-700 disabled:opacity-40"
            >
              Weiter <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
