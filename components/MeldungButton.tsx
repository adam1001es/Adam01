"use client";

import { useState } from "react";
import { Flag, CheckCircle2, Sparkles, HelpCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { MELDUNG_KATEGORIEN, MELDUNG_KATEGORIE_LABEL, MeldungKategorie } from "@/lib/types";

type Ergebnis = {
  status: "automatisch_behoben" | "nicht_behebbar" | "kein_fehler_gefunden" | "fehler";
  diagnose: string;
};

/** Lehrkräfte melden hierüber ein Problem an einem Arbeitsblatt (fehlende Aufgabe, fehlerhaftes
 * Bild, fehlerhafter Text) - die Meldung wird SOFORT automatisch von der KI analysiert und nach
 * Möglichkeit direkt behoben (siehe app/api/worksheet/[id]/meldung + lib/meldungFix.ts), daher
 * kann das Senden bis zu einer Minute dauern. Bewusst als einfaches, ausklappbares Panel statt
 * eines eigenen Modal-Bausteins, den es im Projekt noch nicht gibt. */
export default function MeldungButton({ worksheetId }: { worksheetId: string }) {
  const [offen, setOffen] = useState(false);
  const [kategorie, setKategorie] = useState<MeldungKategorie | null>(null);
  const [beschreibung, setBeschreibung] = useState("");
  const [senden, setSenden] = useState(false);
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function absenden() {
    if (!kategorie) {
      setFehler("Bitte eine Kategorie auswählen.");
      return;
    }
    setSenden(true);
    setFehler(null);
    try {
      const res = await fetch(`/api/worksheet/${worksheetId}/meldung`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kategorie, beschreibung: beschreibung || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      setErgebnis({ status: data.status ?? "fehler", diagnose: data.diagnose ?? "" });
    } catch {
      setFehler("Senden fehlgeschlagen. Bitte nochmal versuchen.");
    } finally {
      setSenden(false);
    }
  }

  if (ergebnis) {
    if (ergebnis.status === "automatisch_behoben") {
      return (
        <div className="no-print max-w-md rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <p className="flex items-center gap-1.5 font-medium">
            <Sparkles size={15} /> Automatisch behoben!
          </p>
          {ergebnis.diagnose && <p className="mt-1 text-brand-700">{ergebnis.diagnose}</p>}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-medium text-white shadow-card"
          >
            <RefreshCw size={13} /> Korrigiertes Arbeitsblatt anzeigen
          </button>
        </div>
      );
    }
    if (ergebnis.status === "kein_fehler_gefunden") {
      return (
        <div className="no-print max-w-md rounded-xl border border-slate-200 bg-surface p-4 text-sm text-slate-600">
          <p className="flex items-center gap-1.5 font-medium text-slate-700">
            <HelpCircle size={15} /> Kein Fehler gefunden
          </p>
          <p className="mt-1">
            {ergebnis.diagnose ||
              "Die KI konnte an dieser Stelle kein Problem feststellen. Falls du dir sicher bist, melde es gerne mit einer genaueren Beschreibung erneut - unser Team schaut es sich dann an."}
          </p>
        </div>
      );
    }
    return (
      <div className="no-print max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="flex items-center gap-1.5 font-medium">
          <AlertTriangle size={15} /> Danke, wir schauen uns das an.
        </p>
        {ergebnis.diagnose && <p className="mt-1">{ergebnis.diagnose}</p>}
      </div>
    );
  }

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-red-300 hover:text-red-700"
      >
        <Flag size={15} /> Problem melden
      </button>
    );
  }

  return (
    <div className="no-print w-full max-w-md rounded-xl border border-slate-200 bg-surface p-4 text-sm shadow-card">
      <p className="font-medium text-slate-700">Was stimmt bei diesem Arbeitsblatt nicht?</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {MELDUNG_KATEGORIEN.map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => setKategorie(k)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              kategorie === k
                ? "border-red-400 bg-red-50 text-red-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {MELDUNG_KATEGORIE_LABEL[k]}
          </button>
        ))}
      </div>
      <textarea
        value={beschreibung}
        onChange={(e) => setBeschreibung(e.target.value)}
        rows={3}
        placeholder="Optional: genauer beschreiben (z.B. welche Aufgabe, welches Bild) - hilft der KI, den Fehler sicher zu finden"
        className="mt-2.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none"
      />
      {fehler && <p className="mt-1.5 text-xs text-red-600">{fehler}</p>}
      {senden && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
          <Sparkles size={13} className="animate-pulse" /> Wird analysiert und wenn möglich
          automatisch behoben … das kann bis zu einer Minute dauern.
        </p>
      )}
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={absenden}
          disabled={senden}
          className="rounded-lg bg-brand-gradient px-3.5 py-1.5 text-xs font-medium text-white shadow-card disabled:opacity-60"
        >
          {senden ? "Sende..." : "Melden"}
        </button>
        <button
          type="button"
          onClick={() => setOffen(false)}
          disabled={senden}
          className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-60"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
