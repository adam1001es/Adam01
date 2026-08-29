"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass } from "@/lib/formStyles";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setIsPending(true);

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, passwort }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFehler(data.error ?? "Etwas ist schiefgelaufen.");
      setIsPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className={labelClass}>E-Mail</span>
        <input
          type="email"
          required
          autoComplete="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Passwort</span>
        <input
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          className={inputClass}
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
        />
        {mode === "register" && (
          <span className="mt-1 block text-xs text-slate-400">Mindestens 8 Zeichen.</span>
        )}
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
        {isPending ? "Bitte warten …" : mode === "login" ? "Anmelden" : "Konto erstellen"}
      </button>
    </form>
  );
}
