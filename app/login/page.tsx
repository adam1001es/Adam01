import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import AuthForm from "@/components/AuthForm";

const VERIFIZIERUNG_FEHLER: Record<string, string> = {
  ungueltig: "Der Bestätigungslink ist ungültig oder abgelaufen. Bitte fordere eine neue Mail über die Anmeldung an.",
  fehlt: "Der Bestätigungslink ist unvollständig.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { verifizierung?: string };
}) {
  const fehlerHinweis = searchParams.verifizierung
    ? VERIFIZIERUNG_FEHLER[searchParams.verifizierung]
    : null;

  return (
    <main className="mx-auto max-w-sm">
      <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-card">
        <h1 className="mb-1 font-display text-2xl font-semibold text-slate-800">Anmelden</h1>
        <p className="mb-6 text-sm text-slate-500">Melde dich mit deinem Konto an.</p>
        {fehlerHinweis && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{fehlerHinweis}</span>
          </div>
        )}
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
