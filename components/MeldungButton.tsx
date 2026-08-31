"use client";

import { useState } from "react";
import { Flag, CheckCircle2 } from "lucide-react";
import { MELDUNG_KATEGORIEN, MELDUNG_KATEGORIE_LABEL, MeldungKategorie } from "@/lib/types";

/** Lehrkräfte melden hierüber ein Problem an einem Arbeitsblatt (fehlende Aufgabe, fehlerhaftes
 * Bild, fehlerhafter Text) - landet unter /admin/meldungen als Grundlage für eine manuelle
 * Erstattung/Nachbesserung. Bewusst als einfaches, ausklappbares Panel statt eines eigenen
 * Modal-Bausteins, den es im Projekt noch nicht gibt. */
export default function MeldungButton({ worksheetId }: { worksheetId: string }) {
  const [offen, setOffen] = useState(false);
  const [kategorie, setKategorie] = useState<MeldungKategorie | null>(null);
  const [beschreibung, setBeschreibung] = useState("");
  const [senden, setSenden] = useState(false);
  const [gesendet, setGesendet] = useState(false);
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
      if (!res.ok) throw new Error();
      setGesendet(true);
    } catch {
      setFehler("Senden fehlgeschlagen. Bitte nochmal versuchen.");
    } finally {
      setSenden(false);
    }
  }

  if (gesendet) {
    return (
      <div className="no-print flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2 text-sm font-medium text-brand-700">
        <CheckCircle2 size={15} /> Danke, wir schauen uns das an.
      </div>
    );
  }

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-red-300 hover:text-red-700"
      >
        <Flag size={15} /> Problem melden
      </button>
    );
  }

  return (
    <div className="no-print w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-card">
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
        placeholder="Optional: genauer beschreiben (z.B. welche Aufgabe, welches Bild)"
        className="mt-2.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none"
      />
      {fehler && <p className="mt-1.5 text-xs text-red-600">{fehler}</p>}
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
          className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
