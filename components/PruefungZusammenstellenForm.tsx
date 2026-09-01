"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass } from "@/lib/formStyles";
import { THEMENBEREICHE, THEMENBEREICH_KEYS, ThemenbereichKey } from "@/lib/curriculum";

interface WorksheetOption {
  id: string;
  thema: string;
  themenbereich: string;
}

export default function PruefungZusammenstellenForm({
  klasseId,
  eigene,
  community,
}: {
  klasseId: string;
  eigene: WorksheetOption[];
  community: WorksheetOption[];
}) {
  const router = useRouter();
  const [ausgewaehlt, setAusgewaehlt] = useState<string[]>([]);
  const [punkteGesamt, setPunkteGesamt] = useState(30);
  const [themenbereichSchwerpunkt, setThemenbereichSchwerpunkt] = useState<ThemenbereichKey | "">("");
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  function toggle(id: string) {
    setAusgewaehlt((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    if (ausgewaehlt.length === 0) {
      setFehler("Bitte mindestens ein Quell-Arbeitsblatt auswählen.");
      return;
    }
    setIsPending(true);
    try {
      const res = await fetch("/api/pruefung/zusammenstellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          klasseId,
          quellWorksheetIds: ausgewaehlt,
          punkteGesamt,
          themenbereichSchwerpunkt: themenbereichSchwerpunkt || undefined,
        }),
      });
      const rohtext = await res.text();
      let data: { worksheetId?: string; error?: string };
      try {
        data = JSON.parse(rohtext);
      } catch {
        throw new Error(
          "Die Zusammenstellung hat zu lange gedauert oder wurde serverseitig abgebrochen. Bitte erneut versuchen.",
        );
      }
      if (!res.ok || !data.worksheetId) {
        throw new Error(data.error ?? "Zusammenstellung fehlgeschlagen.");
      }
      router.push(`/worksheet/${data.worksheetId}`);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setIsPending(false);
    }
  }

  const alle = [
    ...eigene.map((w) => ({ ...w, gruppe: "Eigene Arbeitsblätter" })),
    ...community.map((w) => ({ ...w, gruppe: "Geteilte Arbeitsblätter" })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <span className={labelClass}>Quell-Arbeitsblätter</span>
        {alle.length === 0 ? (
          <p className="text-sm text-slate-400">Noch keine Arbeitsblätter vorhanden.</p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {alle.map((w) => (
              <label
                key={w.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={ausgewaehlt.includes(w.id)}
                  onChange={() => toggle(w.id)}
                  className="rounded border-slate-300"
                />
                <span className="flex-1 truncate">{w.thema}</span>
                <span className="shrink-0 text-xs text-slate-400">{w.gruppe}</span>
              </label>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
          Nur prüfungstaugliche Aufgaben (keine Rätsel-/Bewegungs-/Ausschneide-/Diskussionsformate)
          werden als Kandidaten berücksichtigt.
        </p>
      </div>

      <label className="block max-w-xs">
        <span className={labelClass}>Zielpunktzahl</span>
        <input
          type="number"
          min={1}
          max={200}
          className={inputClass}
          value={punkteGesamt}
          onChange={(e) => setPunkteGesamt(Math.max(1, Number(e.target.value) || 1))}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Thematischer Schwerpunkt (optional)</span>
        <select
          className={inputClass}
          value={themenbereichSchwerpunkt}
          onChange={(e) => setThemenbereichSchwerpunkt(e.target.value as ThemenbereichKey | "")}
        >
          <option value="">Keine Vorgabe - aus allen Quellen mischen</option>
          {THEMENBEREICH_KEYS.map((key) => (
            <option key={key} value={key}>
              {THEMENBEREICHE[key].label}
            </option>
          ))}
        </select>
      </label>

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-klassen-gradient px-4 py-3 font-medium text-white shadow-card-klassen transition hover:shadow-card-klassen-hover disabled:opacity-60"
      >
        {isPending ? "Wird zusammengestellt …" : "Prüfung zusammenstellen"}
      </button>
    </form>
  );
}
