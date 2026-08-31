"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { inputClass, labelClass } from "@/lib/formStyles";

export default function PasswortVergessenForm() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [gesendet, setGesendet] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    await fetch("/api/auth/passwort-vergessen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setIsPending(false);
    setGesendet(true);
  }

  if (gesendet) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-800">
        <div className="mb-2 flex items-center gap-2 font-medium">
          <MailCheck size={18} />
          Mail unterwegs
        </div>
        <p>
          Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir gerade einen Link zum
          Zurücksetzen des Passworts gesendet (1 Stunde gültig).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className={labelClass}>E-Mail-Adresse</span>
        <input
          type="email"
          required
          autoComplete="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
      >
        {isPending ? "Bitte warten …" : "Link zum Zurücksetzen senden"}
      </button>
    </form>
  );
}
