"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { inputClass, labelClass } from "@/lib/formStyles";
import { ROLLEN, ROLLE_LABEL, type Rolle } from "@/lib/rollen";

export default function AdminRolleForm({
  userId,
  initialRolle,
}: {
  userId: string;
  initialRolle: string;
}) {
  const router = useRouter();
  const [rolle, setRolle] = useState<string>(initialRolle);
  const [isPending, setIsPending] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleSave() {
    setIsPending(true);
    setGespeichert(false);
    setFehler(null);
    const res = await fetch(`/api/admin/users/${userId}/rolle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rolle }),
    });
    setIsPending(false);
    if (res.ok) {
      setGespeichert(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setFehler(data?.error ?? "Speichern fehlgeschlagen.");
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className={labelClass}>Rolle</span>
        <select
          value={rolle}
          onChange={(e) => {
            setRolle(e.target.value);
            setGespeichert(false);
          }}
          className={inputClass}
        >
          {ROLLEN.map((r: Rolle) => (
            <option key={r} value={r}>
              {ROLLE_LABEL[r]}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || rolle === initialRolle}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
      >
        {gespeichert && <Check size={14} className="text-brand-600" />}
        {isPending ? "…" : "Speichern"}
      </button>
      {fehler && <p className="w-full text-xs text-red-600">{fehler}</p>}
    </div>
  );
}
