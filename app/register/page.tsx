import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-sm">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <h1 className="mb-1 font-display text-2xl font-semibold text-slate-800">
          Konto erstellen
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Dein Konto ist nach der Registrierung zunächst ohne aktives Abo. Sobald die
          (privat organisierte) Bezahlung eingegangen ist, wird dein Kontingent freigeschaltet.
        </p>
        <AuthForm mode="register" />
        <p className="mt-6 text-center text-sm text-slate-500">
          Schon ein Konto?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </main>
  );
}
