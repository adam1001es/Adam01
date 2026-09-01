"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { SCHULSTUFEN_CLUSTER } from "@/lib/curriculum";

export default function UnterrichtsprofilForm({
  initialStufen,
  onGespeichert,
}: {
  initialStufen: string[];
  /** Wird kurz nach erfolgreichem Speichern aufgerufen (z.B. um die umschließende
   * EinklappbareSectionCard automatisch wieder zuzuklappen). */
  onGespeichert?: () => void;
}) {
  const router = useRouter();
  const [stufen, setStufen] = useState<string[]>(initialStufen);
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);

  function toggle(id: string) {
    setStufen((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    setGespeichert(false);
  }

  async function speichern() {
    setIsPending(true);
    setFehler(null);
    setGespeichert(false);

    const res = await fetch("/api/account/unterrichtsprofil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unterrichtsStufen: stufen }),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);

    if (!res.ok) {
      setFehler(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setGespeichert(true);
    router.refresh();
    if (onGespeichert) setTimeout(onGespeichert, 900);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SCHULSTUFEN_CLUSTER.map((cluster) => {
          const aktiv = stufen.includes(cluster.id);
          return (
            <button
              key={cluster.id}
              type="button"
              onClick={() => toggle(cluster.id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                aktiv
                  ? "border-gold-600 bg-gold-50 text-gold-700"
                  : "border-slate-200 bg-surface text-slate-600 hover:border-gold-300"
              }`}
            >
              {cluster.label}
            </button>
          );
        })}
      </div>

      {fehler && (
        <div className="max-w-xs rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
          {fehler}
        </div>
      )}

      <button
        type="button"
        onClick={speichern}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
      >
        {gespeichert && <Check size={14} className="text-brand-600" />}
        {isPending ? "…" : "Speichern"}
      </button>
    </div>
  );
}
