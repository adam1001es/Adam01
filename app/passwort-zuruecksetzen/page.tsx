import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import PasswortZuruecksetzenForm from "@/components/PasswortZuruecksetzenForm";

export default function PasswortZuruecksetzenPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  return (
    <main className="mx-auto max-w-sm">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <h1 className="mb-1 font-display text-2xl font-semibold text-slate-800">
          Neues Passwort
        </h1>
        {token ? (
          <>
            <p className="mb-6 text-sm text-slate-500">Vergib ein neues Passwort für dein Konto.</p>
            <PasswortZuruecksetzenForm token={token} />
          </>
        ) : (
          <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              Dieser Link ist unvollständig. Bitte fordere unter{" "}
              <Link href="/passwort-vergessen" className="font-medium underline">
                Passwort vergessen
              </Link>{" "}
              einen neuen an.
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
