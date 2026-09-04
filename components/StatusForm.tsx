"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { NUTZER_STATUS, STATUS_LABEL, STATUS_FARBE, type NutzerStatus } from "@/lib/status";

/** Auswahl des eigenen Anwesenheitsstatus (siehe lib/status.ts) - rein manuell, kein
 * automatisches Presence-System. Wird als Farbpunkt am Profilbild angezeigt (siehe
 * components/AvatarKreis.tsx). */
export default function StatusForm({ initialStatus }: { initialStatus: NutzerStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<NutzerStatus>(initialStatus);
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);

  async function waehlen(neu: NutzerStatus) {
    if (neu === status) return;
    setStatus(neu);
    setIsPending(true);
    setFehler(null);
    setGespeichert(false);

    const res = await fetch("/api/account/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: neu }),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);

    if (!res.ok) {
      setFehler(data.error ?? "Speichern fehlgeschlagen.");
      setStatus(initialStatus);
      return;
    }
    setGespeichert(true);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {NUTZER_STATUS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => waehlen(s)}
            disabled={isPending}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition disabled:opacity-60 ${
              status === s
                ? "border-slate-400 bg-slate-100 text-slate-800"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_FARBE[s] }}
            />
            {STATUS_LABEL[s]}
            {status === s && <Check size={14} className="text-slate-500" />}
          </button>
        ))}
      </div>
      {fehler && (
        <div className="max-w-xs rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
          {fehler}
        </div>
      )}
      {gespeichert && !fehler && (
        <p className="text-xs text-slate-400">Gespeichert.</p>
      )}
    </div>
  );
}
