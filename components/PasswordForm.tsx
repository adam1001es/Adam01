"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { inputClass, labelClass } from "@/lib/formStyles";

export default function PasswordForm() {
  const [aktuellesPasswort, setAktuellesPasswort] = useState("");
  const [neuesPasswort, setNeuesPasswort] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setFehler(null);
    setGespeichert(false);

    const res = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktuellesPasswort, neuesPasswort }),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);

    if (!res.ok) {
      setFehler(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setAktuellesPasswort("");
    setNeuesPasswort("");
    setGespeichert(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block max-w-xs">
        <span className={labelClass}>Aktuelles Passwort</span>
        <input
          type="password"
          className={inputClass}
          value={aktuellesPasswort}
          onChange={(e) => {
            setAktuellesPasswort(e.target.value);
            setGespeichert(false);
          }}
          autoComplete="current-password"
          required
        />
      </label>
      <label className="block max-w-xs">
        <span className={labelClass}>Neues Passwort</span>
        <input
          type="password"
          className={inputClass}
          value={neuesPasswort}
          onChange={(e) => {
            setNeuesPasswort(e.target.value);
            setGespeichert(false);
          }}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
          Mindestens 8 Zeichen.
        </span>
      </label>

      {fehler && (
        <div className="max-w-xs rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
          {fehler}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
      >
        {gespeichert && <Check size={14} className="text-brand-600" />}
        {isPending ? "…" : "Passwort ändern"}
      </button>
    </form>
  );
}
