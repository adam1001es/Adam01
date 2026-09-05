"use client";

import { Fragment, useState } from "react";
import { Download, Save } from "lucide-react";
import type { JahresplanKalenderWoche } from "@/lib/jahresplanKalender";
import type { JahresplanWocheZeile } from "@/lib/jahresplan";
import { formatWochenDatum } from "@/lib/jahresplan";

interface ZeileState {
  nummer: number;
  wochenthema: string;
  kompetenzen: string;
  notizen: string;
}

function baueAnfangsZustand(
  kalenderWochen: JahresplanKalenderWoche[],
  eintraege: JahresplanWocheZeile[],
): ZeileState[] {
  const gespeichert = new Map(eintraege.map((e) => [e.nummer, e]));
  return kalenderWochen.map((k) => {
    const e = gespeichert.get(k.nummer);
    return {
      nummer: k.nummer,
      wochenthema: e?.wochenthema ?? "",
      kompetenzen: e?.kompetenzen ?? "",
      notizen: e?.notizen ?? "",
    };
  });
}

const TEXTAREA_KLASSE =
  "w-full resize-none rounded-lg border border-slate-200 bg-transparent px-2 py-1.5 text-xs leading-snug transition focus:border-amber-400 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-amber-100";

/** Editor für eine einzelne Jahresplanung (siehe app/werkzeuge/jahresplanung/[id]) - eine Zeile pro
 * Woche der gewählten Kalender-Variante (siehe lib/jahresplanKalender.ts). Bewusst EIN
 * gemeinsamer "Speichern"-Button für alle ~43 Wochen statt einer Speicherung pro Zeile/Tastendruck
 * (siehe PATCH-Route unter app/api/jahresplaene/[id]/route.ts) - unverändert seit dem letzten
 * Speichern bleibt der Button inaktiv, damit erkennbar ist, ob schon alles gesichert ist. */
export default function JahresplanEditor({
  jahresplanId,
  kalenderWochen,
  eintraege,
}: {
  jahresplanId: string;
  kalenderWochen: JahresplanKalenderWoche[];
  eintraege: JahresplanWocheZeile[];
}) {
  const [zeilen, setZeilen] = useState<ZeileState[]>(() => baueAnfangsZustand(kalenderWochen, eintraege));
  const [gespeicherteZeilen, setGespeicherteZeilen] = useState<ZeileState[]>(zeilen);
  const [isPending, setIsPending] = useState(false);
  const [downloadPending, setDownloadPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);

  const geaendert = JSON.stringify(zeilen) !== JSON.stringify(gespeicherteZeilen);

  function feldAendern(nummer: number, feld: "wochenthema" | "kompetenzen" | "notizen", wert: string) {
    setHinweis(null);
    setZeilen((z) => z.map((zeile) => (zeile.nummer === nummer ? { ...zeile, [feld]: wert } : zeile)));
  }

  async function speichern(): Promise<boolean> {
    setFehler(null);
    setIsPending(true);
    const res = await fetch(`/api/jahresplaene/${jahresplanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wochen: zeilen }),
    });
    setIsPending(false);
    if (res.ok) {
      setGespeicherteZeilen(zeilen);
      setHinweis("Gespeichert.");
      return true;
    }
    const data = await res.json().catch(() => ({}));
    setFehler(data.error ?? "Speichern fehlgeschlagen.");
    return false;
  }

  async function herunterladen() {
    setDownloadPending(true);
    const ok = geaendert ? await speichern() : true;
    setDownloadPending(false);
    if (ok) window.location.href = `/api/jahresplaene/${jahresplanId}/docx`;
  }

  let letztesSemester = 0;

  return (
    <div>
      <div className="no-print sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-surface/95 p-3 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={speichern}
          disabled={isPending || !geaendert}
          className="inline-flex items-center gap-1.5 rounded-full bg-werkzeuge-gradient px-4 py-2 text-sm font-medium text-white shadow-card-werkzeuge disabled:opacity-50"
        >
          <Save size={15} /> {isPending ? "Speichert…" : "Speichern"}
        </button>
        <button
          type="button"
          onClick={herunterladen}
          disabled={downloadPending}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-amber-300 hover:text-amber-700 disabled:opacity-50"
        >
          <Download size={15} /> {downloadPending ? "…" : "Als Word herunterladen"}
        </button>
        {hinweis && <span className="text-xs text-brand-700">{hinweis}</span>}
        {fehler && <span className="text-xs text-red-600">{fehler}</span>}
        {geaendert && !fehler && <span className="text-xs text-amber-700">Ungespeicherte Änderungen</span>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="w-10 border-b border-slate-200 p-2">#</th>
              <th className="w-40 border-b border-slate-200 p-2">Datum / Hijri</th>
              <th className="w-56 border-b border-slate-200 p-2">Anmerkung</th>
              <th className="w-52 border-b border-slate-200 p-2">Wochenthema</th>
              <th className="w-48 border-b border-slate-200 p-2">Kompetenzen</th>
              <th className="w-52 border-b border-slate-200 p-2">Notizen danach</th>
            </tr>
          </thead>
          <tbody>
            {kalenderWochen.map((k) => {
              const zeile = zeilen.find((z) => z.nummer === k.nummer)!;
              const neuesSemester = k.semester !== letztesSemester;
              letztesSemester = k.semester;
              return (
                <Fragment key={k.nummer}>
                  {neuesSemester && (
                    <tr key={`semester-${k.semester}`}>
                      <td colSpan={6} className="border-b border-slate-200 bg-brand-50 px-2 py-1.5 text-xs font-semibold text-brand-800">
                        {k.semester}. Semester
                      </td>
                    </tr>
                  )}
                  <tr key={k.nummer} className="align-top odd:bg-white even:bg-slate-50/50">
                    <td className="border-b border-slate-100 p-2 text-xs font-semibold text-slate-500">{k.nummer}</td>
                    <td className="border-b border-slate-100 p-2 text-xs text-slate-600">
                      <div>{formatWochenDatum(k.von, k.bis)}</div>
                      <div className="mt-0.5 text-slate-400">{k.hijri}</div>
                    </td>
                    <td className="border-b border-slate-100 p-2 text-xs text-slate-500">
                      {k.anmerkungen.map((a, i) => (
                        <div key={i}>{a}</div>
                      ))}
                    </td>
                    <td className="border-b border-slate-100 p-1.5">
                      <textarea
                        value={zeile.wochenthema}
                        onChange={(e) => feldAendern(k.nummer, "wochenthema", e.target.value)}
                        rows={2}
                        className={TEXTAREA_KLASSE}
                      />
                    </td>
                    <td className="border-b border-slate-100 p-1.5">
                      <textarea
                        value={zeile.kompetenzen}
                        onChange={(e) => feldAendern(k.nummer, "kompetenzen", e.target.value)}
                        rows={2}
                        placeholder="z.B. Glaubensbasis (Aqida)"
                        className={TEXTAREA_KLASSE}
                      />
                    </td>
                    <td className="border-b border-slate-100 p-1.5">
                      <textarea
                        value={zeile.notizen}
                        onChange={(e) => feldAendern(k.nummer, "notizen", e.target.value)}
                        rows={2}
                        className={TEXTAREA_KLASSE}
                      />
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
