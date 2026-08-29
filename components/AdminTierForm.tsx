"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export default function AdminTierForm({
  userId,
  initialTier,
}: {
  userId: string;
  initialTier: string | null;
}) {
  const router = useRouter();
  const [tier, setTier] = useState<string>(initialTier ?? "");
  const [isPending, setIsPending] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);

  async function handleSave() {
    setIsPending(true);
    setGespeichert(false);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: tier || null }),
    });
    setIsPending(false);
    if (res.ok) {
      setGespeichert(true);
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={tier}
        onChange={(e) => {
          setTier(e.target.value);
          setGespeichert(false);
        }}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
      >
        <option value="">Kein Abo</option>
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
  );
}
