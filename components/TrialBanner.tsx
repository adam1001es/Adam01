import Link from "next/link";
import { Gift, AlertTriangle } from "lucide-react";

export default function TrialBanner({ remaining, limit }: { remaining: number; limit: number }) {
  if (remaining <= 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div>
          <div className="font-medium">Kostenlose Testversion aufgebraucht</div>
          <p className="mt-0.5">
            Du hast bereits {limit} Arbeitsblätter kostenlos ausprobiert.{" "}
            <Link href="/register" className="font-medium underline">
              Jetzt registrieren
            </Link>
            , um weiterzumachen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800 shadow-sm">
      <Gift size={18} className="mt-0.5 shrink-0" />
      <div>
        <div className="font-medium">Kostenlos testen – kein Konto nötig</div>
        <p className="mt-0.5">
          Noch {remaining} von {limit} Arbeitsblättern ohne Anmeldung möglich.{" "}
          <Link href="/register" className="font-medium underline">
            Registrieren
          </Link>{" "}
          gibt dir unbegrenztes Kontingent nach Freischaltung.
        </p>
      </div>
    </div>
  );
}
