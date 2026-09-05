"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { inputClass, labelClass } from "@/lib/formStyles";

const BESTAETIGUNGSWORT = "LÖSCHEN";

export default function KontoLoeschenForm() {
  const [passwort, setPasswort] = useState("");
  const [bestaetigung, setBestaetigung] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const bestaetigungStimmt = bestaetigung.trim().toUpperCase() === BESTAETIGUNGSWORT;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bestaetigungStimmt) return;
    setIsPending(true);
    setFehler(null);

    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwort, bestaetigung }),
    });

    if (res.ok) {
      // Vollständige Neuladung statt router.push, damit Header/Nav überall zuverlässig den
      // ausgeloggten Zustand zeigen und kein clientseitig gecachter Nutzerstatus stehen bleibt.
      window.location.href = "/login?konto=geloescht";
      return;
    }

    const data = await res.json().catch(() => ({}));
    setFehler(data.error ?? "Löschen fehlgeschlagen.");
    setIsPending(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
        <p className="flex items-start gap-2 font-medium">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Das kann nicht rückgängig gemacht werden.
        </p>
        <ul className="mt-2 ml-6 list-disc space-y-1 text-red-700">
          <li>Deine Klassen inkl. Schüler:innen, Zuweisungen und Noten werden endgültig gelöscht.</li>
          <li>
            Deine Forum-Beiträge (Themen, Antworten, Chat-Nachrichten) werden gelöscht - bei
            eigenen Themen auch die Antworten anderer Kolleg:innen darauf.
          </li>
          <li>
            Deine Arbeitsblätter bleiben bestehen (auch bereits geteilte Links), sind danach aber
            niemandem mehr zugeordnet - „Eine Lehrkraft" statt deinem Namen.
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block max-w-xs">
          <span className={labelClass}>Passwort zur Bestätigung</span>
          <input
            type="password"
            className={inputClass}
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label className="block max-w-xs">
          <span className={labelClass}>
            Tippe <strong>{BESTAETIGUNGSWORT}</strong> zur Bestätigung
          </span>
          <input
            type="text"
            className={inputClass}
            value={bestaetigung}
            onChange={(e) => setBestaetigung(e.target.value)}
            autoComplete="off"
            required
          />
        </label>

        {fehler && (
          <div className="max-w-xs rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
            {fehler}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !bestaetigungStimmt || !passwort}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={14} />
          {isPending ? "…" : "Konto endgültig löschen"}
        </button>
      </form>
    </div>
  );
}
