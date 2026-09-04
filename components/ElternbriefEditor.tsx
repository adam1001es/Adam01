"use client";

import { useEffect, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { absaetzeZuText, fuelleVorlage, type ElternbriefVorlage } from "@/lib/elternbriefe";
import { inputClass, labelClass } from "@/lib/formStyles";

/** Editor für eine Elternbrief-Vorlage (siehe app/werkzeuge/elternbriefe/[id]) - Angaben ausfüllen
 * erzeugt einen Entwurf, den die Lehrkraft danach in einem normalen Textfeld frei umformulieren
 * kann (nicht nur Platzhalter füllen), bevor sie ihn als fertiges Word-Dokument herunterlädt. Der
 * Download schickt den aktuellen, ggf. handbearbeiteten Text (nicht mehr die Feldwerte) an die
 * API - siehe app/api/werkzeuge/elternbriefe/[id]/route.ts. Kein KI-Aufruf: die Entwurfserzeugung
 * ist reines Textersetzen, siehe lib/elternbriefe.ts/lib/elternbriefeDocx.ts.
 *
 * Sobald die Lehrkraft den Text von Hand ändert (bearbeitet=true), wird er NICHT mehr automatisch
 * neu aus den Feldern erzeugt - sonst würden Tippfehler-Korrekturen in den Feldern eigene
 * Formulierungen überschreiben. "Entwurf neu erstellen" setzt bewusst zurück. */
export default function ElternbriefEditor({ vorlage }: { vorlage: ElternbriefVorlage }) {
  const [werte, setWerte] = useState<Record<string, string>>({});
  const [islamischerGruss, setIslamischerGruss] = useState(true);
  const [text, setText] = useState(() => absaetzeZuText(fuelleVorlage(vorlage, {}, true)));
  const [bearbeitet, setBearbeitet] = useState(false);
  const [wirdHeruntergeladen, setWirdHeruntergeladen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    if (bearbeitet) return;
    setText(absaetzeZuText(fuelleVorlage(vorlage, werte, islamischerGruss)));
  }, [vorlage, werte, islamischerGruss, bearbeitet]);

  function entwurfNeuErstellen() {
    setBearbeitet(false);
    setText(absaetzeZuText(fuelleVorlage(vorlage, werte, islamischerGruss)));
  }

  async function herunterladen() {
    setFehler(null);
    setWirdHeruntergeladen(true);
    try {
      const res = await fetch(`/api/werkzeuge/elternbriefe/${vorlage.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
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

        <label className="mt-4 flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            checked={islamischerGruss}
            onChange={(e) => setIslamischerGruss(e.target.checked)}
          />
          <span>
            Islamischen Gruß voranstellen <span className="text-slate-400">(„As-salamu alaikum…“)</span>
          </span>
        </label>

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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-slate-800">Brieftext</h2>
          {bearbeitet && (
            <button
              type="button"
              onClick={entwurfNeuErstellen}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-amber-700"
            >
              <RotateCcw size={13} /> Entwurf neu erstellen
            </button>
          )}
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Du kannst den Text hier frei umformulieren - er wird beim Herunterladen genau so
          übernommen.
        </p>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setBearbeitet(true);
          }}
          rows={20}
          className="w-full resize-y rounded-xl border border-slate-200 bg-canvas p-3 text-sm leading-relaxed text-slate-700 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>
    </div>
  );
}
