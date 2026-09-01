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

function heutigesDatum(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ZuweisenForm({
  klasseId,
  eigene,
  community,
}: {
  klasseId: string;
  eigene: WorksheetOption[];
  community: WorksheetOption[];
}) {
  const router = useRouter();
  const [modus, setModus] = useState<"blatt" | "manuell">(eigene.length + community.length > 0 ? "blatt" : "manuell");
  const [worksheetId, setWorksheetId] = useState(eigene[0]?.id ?? community[0]?.id ?? "");
  const [titel, setTitel] = useState("");
  const [themenbereich, setThemenbereich] = useState<ThemenbereichKey>("gemischt");
  const [datum, setDatum] = useState(heutigesDatum());
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setIsPending(true);
    const body =
      modus === "blatt"
        ? { worksheetId, datum }
        : { titel, themenbereich, datum };
    const res = await fetch(`/api/klassen/${klasseId}/zuweisungen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);
    if (!res.ok) {
      setFehler(data.error ?? "Zuweisung konnte nicht gespeichert werden.");
      return;
    }
    router.push(`/klassen/${klasseId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModus("blatt")}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
            modus === "blatt" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"
          }`}
        >
          Eigenes/geteiltes Blatt
        </button>
        <button
          type="button"
          onClick={() => setModus("manuell")}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
            modus === "manuell" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"
          }`}
        >
          Manueller Eintrag
        </button>
      </div>

      {modus === "blatt" ? (
        eigene.length + community.length === 0 ? (
          <p className="text-sm text-slate-400">
            Noch keine Arbeitsblätter vorhanden - erst eines erstellen oder „Manueller Eintrag"
            wählen.
          </p>
        ) : (
          <label className="block">
            <span className={labelClass}>Arbeitsblatt</span>
            <select
              className={inputClass}
              value={worksheetId}
              onChange={(e) => setWorksheetId(e.target.value)}
              required
            >
              {eigene.length > 0 && (
                <optgroup label="Eigene Arbeitsblätter">
                  {eigene.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.thema}
                    </option>
                  ))}
                </optgroup>
              )}
              {community.length > 0 && (
                <optgroup label="Geteilte Arbeitsblätter">
                  {community.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.thema}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        )
      ) : (
        <>
          <label className="block">
            <span className={labelClass}>Titel</span>
            <input
              className={inputClass}
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="z.B. Ramadan-Arbeitsblatt (eigenes Material)"
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>Grundkompetenz</span>
            <select
              className={inputClass}
              value={themenbereich}
              onChange={(e) => setThemenbereich(e.target.value as ThemenbereichKey)}
            >
              {THEMENBEREICH_KEYS.map((key) => (
                <option key={key} value={key}>
                  {THEMENBEREICHE[key].label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      <label className="block max-w-xs">
        <span className={labelClass}>Datum</span>
        <input
          type="date"
          className={inputClass}
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          required
        />
      </label>

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}

      <button
        type="submit"
        disabled={isPending || (modus === "blatt" && !worksheetId)}
        className="w-full rounded-xl bg-klassen-gradient px-4 py-3 font-medium text-white shadow-card-klassen transition hover:shadow-card-klassen-hover disabled:opacity-60"
      >
        {isPending ? "…" : "Zuweisen"}
      </button>
    </form>
  );
}
