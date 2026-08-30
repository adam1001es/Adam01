"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

/** Formatiert ein Date als "YYYY-MM-DD" für ein <input type="date"> (lokale Zeitzone, nicht UTC
 * - toISOString() würde bei Zeiten nahe Mitternacht auf den falschen Tag verschieben). */
function alsDatumInputWert(datum: Date | null): string {
  if (!datum) return "";
  const jahr = datum.getFullYear();
  const monat = String(datum.getMonth() + 1).padStart(2, "0");
  const tag = String(datum.getDate()).padStart(2, "0");
  return `${jahr}-${monat}-${tag}`;
}

export default function AdminTierForm({
  userId,
  initialTier,
  initialGueltigVon,
  initialGueltigBis,
}: {
  userId: string;
  initialTier: string | null;
  initialGueltigVon: Date | null;
  initialGueltigBis: Date | null;
}) {
  const router = useRouter();
  const [tier, setTier] = useState<string>(initialTier ?? "");
  const [gueltigVon, setGueltigVon] = useState(alsDatumInputWert(initialGueltigVon));
  const [gueltigBis, setGueltigBis] = useState(alsDatumInputWert(initialGueltigBis));
  const [isPending, setIsPending] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleSave() {
    setIsPending(true);
    setGespeichert(false);
    setFehler(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tier: tier || null,
        tierGueltigVon: gueltigVon || null,
        tierGueltigBis: gueltigBis || null,
      }),
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
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <select
          value={tier}
          onChange={(e) => {
            setTier(e.target.value);
            setGespeichert(false);
          }}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
        >
          <option value="">Kostenlos (3/Monat)</option>
          <option value="starter">Starter (30/Monat)</option>
          <option value="pro">Pro (80/Monat)</option>
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
        >
          {gespeichert ? <Check size={14} className="text-brand-600" /> : null}
          {isPending ? "…" : "Speichern"}
        </button>
      </div>
      {tier && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <label className="flex items-center gap-1">
            von
            <input
              type="date"
              value={gueltigVon}
              onChange={(e) => {
                setGueltigVon(e.target.value);
                setGespeichert(false);
              }}
              className="rounded border border-slate-300 bg-white px-1.5 py-1 text-xs"
            />
          </label>
          <label className="flex items-center gap-1">
            bis
            <input
              type="date"
              value={gueltigBis}
              onChange={(e) => {
                setGueltigBis(e.target.value);
                setGespeichert(false);
              }}
              className="rounded border border-slate-300 bg-white px-1.5 py-1 text-xs"
            />
          </label>
        </div>
      )}
      {fehler && <p className="text-xs text-red-600">{fehler}</p>}
    </div>
  );
}
