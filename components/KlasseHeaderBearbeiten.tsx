"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Pencil, Check, X } from "lucide-react";
import { SCHULSTUFEN_OPTIONEN } from "@/lib/curriculum";

/** Klassenname/-schulstufe direkt im Kopfbereich der Detailseite umbenennbar (analog zum
 * Schüler-Umbenennen in SchuelerVerwaltung.tsx) - PATCH /api/klassen/[id] existierte bisher nur
 * ohne UI-Zugang. */
export default function KlasseHeaderBearbeiten({
  klasseId,
  name,
  schulstufe,
}: {
  klasseId: string;
  name: string;
  schulstufe: string | null;
}) {
  const router = useRouter();
  const [bearbeiten, setBearbeiten] = useState(false);
  const [neuerName, setNeuerName] = useState(name);
  const [neueSchulstufe, setNeueSchulstufe] = useState(schulstufe ?? "");
  const [isPending, setIsPending] = useState(false);

  async function speichern() {
    if (!neuerName.trim()) return;
    setIsPending(true);
    const res = await fetch(`/api/klassen/${klasseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: neuerName.trim(), schulstufe: neueSchulstufe || null }),
    });
    setIsPending(false);
    if (res.ok) {
      setBearbeiten(false);
      router.refresh();
    }
  }

  if (bearbeiten) {
    return (
      <div className="max-w-sm rounded-xl bg-white/95 p-3.5 shadow-card">
        <input
          autoFocus
          value={neuerName}
          onChange={(e) => setNeuerName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") speichern();
            if (e.key === "Escape") setBearbeiten(false);
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-violet-500 focus:outline-none"
        />
        <select
          value={neueSchulstufe}
          onChange={(e) => setNeueSchulstufe(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 focus:border-violet-500 focus:outline-none"
        >
          <option value="">Keine Angabe zur Schulstufe</option>
          {SCHULSTUFEN_OPTIONEN.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={speichern}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-klassen-gradient px-3 py-1.5 text-xs font-medium text-white shadow-sm disabled:opacity-60"
          >
            <Check size={13} /> {isPending ? "…" : "Speichern"}
          </button>
          <button
            type="button"
            onClick={() => setBearbeiten(false)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <X size={13} /> Abbrechen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="flex items-center gap-2.5 font-display text-3xl font-semibold text-white sm:text-4xl">
        <GraduationCap size={28} strokeWidth={2} />
        {name}
        <button
          type="button"
          onClick={() => {
            setNeuerName(name);
            setNeueSchulstufe(schulstufe ?? "");
            setBearbeiten(true);
          }}
          title="Klasse bearbeiten"
          className="rounded-full p-1.5 text-white/60 transition hover:bg-white/15 hover:text-white"
        >
          <Pencil size={16} />
        </button>
      </h1>
      {schulstufe && <p className="mt-1 text-sm text-violet-50/90">{schulstufe}</p>}
    </div>
  );
}
