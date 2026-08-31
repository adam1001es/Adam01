import Link from "next/link";
import PasswortVergessenForm from "@/components/PasswortVergessenForm";

export default function PasswortVergessenPage() {
  return (
    <main className="mx-auto max-w-sm">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <h1 className="mb-1 font-display text-2xl font-semibold text-slate-800">
          Passwort vergessen
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Gib deine E-Mail-Adresse ein - wir schicken dir einen Link zum Zurücksetzen.
        </p>
        <PasswortVergessenForm />
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </main>
  );
}
