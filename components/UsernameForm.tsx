"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { inputClass, labelClass } from "@/lib/formStyles";

export default function UsernameForm({ initialUsername }: { initialUsername: string | null }) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername ?? "");
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setFehler(null);
    setGespeichert(false);

    const res = await fetch("/api/account/username", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);

    if (!res.ok) {
      setFehler(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setUsername(data.username);
    setGespeichert(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block max-w-xs">
        <span className={labelClass}>Benutzername</span>
        <input
          className={inputClass}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setGespeichert(false);
          }}
          placeholder="z.B. m.mustermann"
          minLength={3}
          maxLength={20}
        />
        <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
          3-20 Zeichen: Buchstaben (Groß-/Kleinschreibung möglich), Ziffern, Punkt, Bindestrich,
          Unterstrich. Danach kannst du dich damit statt mit der E-Mail-Adresse anmelden - die
          Groß-/Kleinschreibung spielt beim Anmelden keine Rolle.
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
        {isPending ? "…" : "Speichern"}
      </button>
    </form>
  );
}
