"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass } from "@/lib/formStyles";

export default function PasswortZuruecksetzenForm({ token }: { token: string }) {
  const router = useRouter();
  const [neuesPasswort, setNeuesPasswort] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setFehler(null);

    const res = await fetch("/api/auth/passwort-zuruecksetzen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, neuesPasswort }),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);

    if (!res.ok) {
      setFehler(data.error ?? "Etwas ist schiefgelaufen.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className={labelClass}>Neues Passwort</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
          value={neuesPasswort}
          onChange={(e) => setNeuesPasswort(e.target.value)}
        />
        <span className="mt-1 block text-xs text-slate-400">Mindestens 8 Zeichen.</span>
      </label>

      {fehler && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {fehler}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
      >
        {isPending ? "Bitte warten …" : "Passwort speichern"}
      </button>
    </form>
  );
}
