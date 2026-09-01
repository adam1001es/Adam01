"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Check, X } from "lucide-react";
import EinfacherLoeschButton from "./EinfacherLoeschButton";

interface SchuelerZeile {
  id: string;
  label: string;
}

/** Roster-Verwaltung einer Klasse - bewusst nur ein Pseudonym-Feld pro Schüler:in (siehe
 * Schueler.label in prisma/schema.prisma), kein Namensfeld. "Hinzufügen" ohne eigene Eingabe
 * vergibt automatisch "Schüler N" (siehe app/api/klassen/[id]/schueler). */
export default function SchuelerVerwaltung({
  klasseId,
  schueler,
}: {
  klasseId: string;
  schueler: SchuelerZeile[];
}) {
  const router = useRouter();
  const [hinzufuegen, setHinzufuegen] = useState(false);
  const [neuesLabel, setNeuesLabel] = useState("");
  const [bearbeiteId, setBearbeiteId] = useState<string | null>(null);
  const [bearbeiteLabel, setBearbeiteLabel] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function hinzufuegenSpeichern() {
    setIsPending(true);
    const res = await fetch(`/api/klassen/${klasseId}/schueler`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: neuesLabel || undefined }),
    });
    setIsPending(false);
    if (res.ok) {
      setNeuesLabel("");
      setHinzufuegen(false);
      router.refresh();
    }
  }

  async function umbenennenSpeichern(schuelerId: string) {
    if (!bearbeiteLabel.trim()) return;
    setIsPending(true);
    const res = await fetch(`/api/klassen/${klasseId}/schueler/${schuelerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: bearbeiteLabel.trim() }),
    });
    setIsPending(false);
    if (res.ok) {
      setBearbeiteId(null);
      router.refresh();
    }
  }

  return (
    <div>
      {schueler.length === 0 ? (
        <p className="text-sm text-slate-400">Noch keine Schüler:innen erfasst.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {schueler.map((s) => (
            <li
              key={s.id}
              className="group flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/60 py-1 pl-3 pr-1.5 text-sm text-slate-700"
            >
              {bearbeiteId === s.id ? (
                <>
                  <input
                    autoFocus
                    value={bearbeiteLabel}
                    onChange={(e) => setBearbeiteLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") umbenennenSpeichern(s.id);
                      if (e.key === "Escape") setBearbeiteId(null);
                    }}
                    className="w-24 rounded border border-brand-300 px-1.5 py-0.5 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => umbenennenSpeichern(s.id)}
                    disabled={isPending}
                    className="rounded-full p-1 text-brand-600 hover:bg-brand-50"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBearbeiteId(null)}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <>
                  {s.label}
                  <button
                    type="button"
                    onClick={() => {
                      setBearbeiteId(s.id);
                      setBearbeiteLabel(s.label);
                    }}
                    title="Umbenennen"
                    className="rounded-full p-1 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-500 group-hover:opacity-100"
                  >
                    <Pencil size={12} />
                  </button>
                  <EinfacherLoeschButton
                    url={`/api/klassen/${klasseId}/schueler/${s.id}`}
                    bestaetigung={`"${s.label}" wirklich entfernen? Vorhandene Ergebnisse dieser Person gehen dabei verloren.`}
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {hinzufuegen ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            autoFocus
            value={neuesLabel}
            onChange={(e) => setNeuesLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && hinzufuegenSpeichern()}
            placeholder={`Schüler ${schueler.length + 1} (leer = automatisch)`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={hinzufuegenSpeichern}
            disabled={isPending}
            className="rounded-lg bg-brand-gradient px-3 py-1.5 text-sm font-medium text-white shadow-sm"
          >
            {isPending ? "…" : "Hinzufügen"}
          </button>
          <button
            type="button"
            onClick={() => setHinzufuegen(false)}
            className="text-sm text-slate-500 hover:text-brand-700"
          >
            Abbrechen
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setHinzufuegen(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
        >
          <Plus size={13} /> Schüler:in hinzufügen
        </button>
      )}
    </div>
  );
}
