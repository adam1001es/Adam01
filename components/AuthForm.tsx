"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { inputClass, labelClass } from "@/lib/formStyles";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [kennung, setKennung] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [unverifizierteEmail, setUnverifizierteEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "pending" | "gesendet">("idle");
  const [isPending, setIsPending] = useState(false);
  const [registriertePendingEmail, setRegistriertePendingEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setUnverifizierteEmail(null);
    setIsPending(true);

    const body =
      mode === "login" ? { kennung, passwort } : { email: kennung, passwort };
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);

    if (!res.ok) {
      if (data.unverifiziert) {
        setUnverifizierteEmail(data.email ?? kennung);
      }
      setFehler(data.error ?? "Etwas ist schiefgelaufen.");
      return;
    }

    if (mode === "register") {
      setRegistriertePendingEmail(data.email ?? kennung);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleResend() {
    if (!unverifizierteEmail) return;
    setResendStatus("pending");
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unverifizierteEmail }),
    });
    setResendStatus("gesendet");
  }

  if (registriertePendingEmail) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-800">
        <div className="mb-2 flex items-center gap-2 font-medium">
          <MailCheck size={18} />
          Fast geschafft!
        </div>
        <p>
          Wir haben eine Bestätigungs-Mail an <strong>{registriertePendingEmail}</strong> gesendet.
          Bitte klicke auf den Link darin, um dein Konto zu aktivieren - danach kannst du dich
          anmelden.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className={labelClass}>{mode === "login" ? "E-Mail oder Benutzername" : "E-Mail"}</span>
        <input
          type={mode === "login" ? "text" : "email"}
          required
          autoComplete={mode === "login" ? "username" : "email"}
          className={inputClass}
          value={kennung}
          onChange={(e) => setKennung(e.target.value)}
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
        {mode === "login" && (
          <Link
            href="/passwort-vergessen"
            className="mt-1.5 inline-block text-xs font-medium text-brand-600 hover:underline"
          >
            Passwort vergessen?
          </Link>
        )}
      </label>

      {fehler && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {fehler}
          {unverifizierteEmail && (
            <div className="mt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus !== "idle"}
                className="font-medium text-red-800 underline underline-offset-2 disabled:no-underline disabled:opacity-70"
              >
                {resendStatus === "gesendet"
                  ? "Bestätigungs-Mail erneut gesendet."
                  : resendStatus === "pending"
                    ? "Wird gesendet …"
                    : "Bestätigungs-Mail erneut senden"}
              </button>
            </div>
          )}
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
