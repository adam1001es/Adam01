"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { inputClass, labelClass } from "@/lib/formStyles";

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

  const keinPaket = tier === "";

  async function handleSave() {
    setIsPending(true);
    setGespeichert(false);
    setFehler(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tier: tier || null,
        tierGueltigVon: keinPaket ? null : gueltigVon || null,
        tierGueltigBis: keinPaket ? null : gueltigBis || null,
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
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <label className="block">
        <span className={labelClass}>Paket</span>
        <select
          value={tier}
          onChange={(e) => {
            setTier(e.target.value);
            setGespeichert(false);
          }}
          className={inputClass}
        >
          <option value="">Kostenlos (3/Monat)</option>
          <option value="starter">Starter (30/Monat)</option>
          <option value="pro">Pro (80/Monat)</option>
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>Gültig von</span>
        <input
          type="date"
          disabled={keinPaket}
          value={gueltigVon}
          onChange={(e) => {
            setGueltigVon(e.target.value);
            setGespeichert(false);
          }}
          className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300`}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Gültig bis</span>
        <input
          type="date"
          disabled={keinPaket}
          value={gueltigBis}
          onChange={(e) => {
            setGueltigBis(e.target.value);
            setGespeichert(false);
          }}
          className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300`}
        />
      </label>

      <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
        >
          {gespeichert && <Check size={14} className="text-brand-600" />}
          {isPending ? "…" : "Speichern"}
        </button>
        {keinPaket ? (
          <p className="text-xs text-slate-400">
            Erst ein Paket auswählen, um optional einen Zeitraum festzulegen - ohne Zeitraum gilt
            das Paket unbefristet.
          </p>
        ) : (
          <p className="text-xs text-slate-400">Leer lassen = unbefristet in diese Richtung.</p>
        )}
        {fehler && <p className="w-full text-xs text-red-600">{fehler}</p>}
      </div>
    </div>
  );
}
