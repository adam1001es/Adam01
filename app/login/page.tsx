import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <h1 className="mb-1 font-display text-2xl font-semibold text-slate-800">Anmelden</h1>
        <p className="mb-6 text-sm text-slate-500">Melde dich mit deinem Konto an.</p>
        <AuthForm mode="login" />
        <p className="mt-6 text-center text-sm text-slate-500">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium text-brand-600 hover:underline">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </main>
  );
}
