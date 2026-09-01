"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { inputClass, labelClass } from "@/lib/formStyles";

export default function EmailForm({ aktuelleEmail }: { aktuelleEmail: string }) {
  const [neueEmail, setNeueEmail] = useState("");
  const [aktuellesPasswort, setAktuellesPasswort] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gesendetAn, setGesendetAn] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setFehler(null);

    const res = await fetch("/api/account/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ neueEmail, aktuellesPasswort }),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);

    if (!res.ok) {
      setFehler(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setGesendetAn(data.pendingEmail);
    setNeueEmail("");
    setAktuellesPasswort("");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Aktuell: <span className="font-medium text-slate-700">{aktuelleEmail}</span>
      </p>

      {gesendetAn && (
        <div className="max-w-sm rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
          <div className="flex items-center gap-1.5 font-medium">
            <MailCheck size={15} /> Bestätigung ausstehend
          </div>
          <p className="mt-1">
            Wir haben eine Bestätigungs-Mail an <strong>{gesendetAn}</strong> gesendet. Erst nach
            Klick auf den Link darin wird sie zu deiner neuen Anmelde-Adresse - bis dahin bleibt{" "}
            {aktuelleEmail} aktiv.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block max-w-xs">
          <span className={labelClass}>Neue E-Mail-Adresse</span>
          <input
            type="email"
            className={inputClass}
            value={neueEmail}
            onChange={(e) => setNeueEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block max-w-xs">
          <span className={labelClass}>Aktuelles Passwort zur Bestätigung</span>
          <input
            type="password"
            className={inputClass}
            value={aktuellesPasswort}
            onChange={(e) => setAktuellesPasswort(e.target.value)}
            autoComplete="current-password"
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
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
        >
          {isPending ? "…" : "Bestätigungs-Mail senden"}
        </button>
      </form>
    </div>
  );
}
