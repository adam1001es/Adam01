"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { prozentZuNote, NOTE_LABEL } from "@/lib/noten";
import { inputClass } from "@/lib/formStyles";

interface SchuelerZeile {
  id: string;
  label: string;
  prozent: number | null;
  notiz: string;
}

/** Eingabemaske für alle Schüler-Ergebnisse einer Zuweisung auf einmal (siehe
 * app/api/klassen/[id]/zuweisungen/[zid]/ergebnisse) - "prozent" ist die einzige gespeicherte
 * Kennzahl, die daraus abgeleitete Note (siehe lib/noten.ts) ist nur eine Live-Anzeige zur
 * Orientierung. */
export default function ErgebnisseForm({
  klasseId,
  zuweisungId,
  schueler,
}: {
  klasseId: string;
  zuweisungId: string;
  schueler: SchuelerZeile[];
}) {
  const router = useRouter();
  const [werte, setWerte] = useState<Record<string, { prozent: string; notiz: string }>>(
    Object.fromEntries(
      schueler.map((s) => [s.id, { prozent: s.prozent === null ? "" : String(s.prozent), notiz: s.notiz }]),
    ),
  );
  const [isPending, setIsPending] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setGespeichert(false);
    setIsPending(true);
    const ergebnisse = schueler.map((s) => {
      const eingabe = werte[s.id];
      const prozent = eingabe.prozent.trim() === "" ? null : Math.max(0, Math.min(100, Number(eingabe.prozent)));
      return { schuelerId: s.id, prozent, notiz: eingabe.notiz || undefined };
    });
    const res = await fetch(`/api/klassen/${klasseId}/zuweisungen/${zuweisungId}/ergebnisse`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ergebnisse }),
    });
    setIsPending(false);
    if (res.ok) {
      setGespeichert(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setFehler(data.error ?? "Speichern fehlgeschlagen.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {schueler.map((s) => {
        const eingabe = werte[s.id];
        const prozentZahl = eingabe.prozent.trim() === "" ? null : Number(eingabe.prozent);
        return (
          <div key={s.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:grid-cols-[120px_100px_1fr]">
            <span className="text-sm font-medium text-slate-700">{s.label}</span>
            <div>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="%"
                className={`${inputClass} py-1.5`}
                value={eingabe.prozent}
                onChange={(e) =>
                  setWerte((prev) => ({ ...prev, [s.id]: { ...prev[s.id], prozent: e.target.value } }))
                }
              />
              {prozentZahl !== null && !Number.isNaN(prozentZahl) && (
                <span className="mt-0.5 block text-[11px] text-slate-400">
                  Note {prozentZuNote(prozentZahl)} · {NOTE_LABEL[prozentZuNote(prozentZahl)]}
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="Notiz (optional)"
              className={`${inputClass} py-1.5`}
              value={eingabe.notiz}
              onChange={(e) =>
                setWerte((prev) => ({ ...prev, [s.id]: { ...prev[s.id], notiz: e.target.value } }))
              }
            />
          </div>
        );
      })}

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-xl bg-brand-gradient px-4 py-3 font-medium text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
      >
        {isPending ? "…" : gespeichert ? "Gespeichert ✓" : "Ergebnisse speichern"}
      </button>
    </form>
  );
}
