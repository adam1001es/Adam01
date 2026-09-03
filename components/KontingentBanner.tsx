import { Gauge, ShieldCheck } from "lucide-react";
import type { Kontingent } from "@/lib/quota";
import { tierLabel, formatArbeitsblaetterSpanne } from "@/lib/quota";

export default function KontingentBanner({ kontingent }: { kontingent: Kontingent }) {
  if (kontingent.unbegrenzt) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800 shadow-sm">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <div>
          <span className="font-medium">Admin-Konto – unbegrenztes Kontingent</span>
          <p className="mt-0.5 opacity-80">
            {kontingent.verbraucht} Punkte in diesem Zyklus verbraucht, kein Limit.
          </p>
        </div>
      </div>
    );
  }

  const prozent = Math.min(100, Math.round((kontingent.verbraucht / kontingent.limit) * 100));
  const knapp = kontingent.verbleibend === 0;
  // Nur bei aktivem Abo gibt es einen wiederkehrenden Zyklus - das einmalige Gratis-Kontingent
  // (siehe KOSTENLOS_PUNKTE_LIMIT in lib/quota.ts) kennt keinen Reset, daher andere Formulierung.
  const hatZyklus = Boolean(kontingent.tier);

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm shadow-sm ${
        knapp ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-surface text-slate-600"
      }`}
    >
      <Gauge size={18} className="mt-0.5 shrink-0" />
      <div className="w-full">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="font-medium">{tierLabel(kontingent.tier)}</span>
          <span>
            {kontingent.verbraucht} / {kontingent.limit} Punkte
            {hatZyklus ? " in diesem Zyklus" : " insgesamt"}
          </span>
        </div>
        <p className="mt-0.5 text-xs opacity-75">
          Noch {formatArbeitsblaetterSpanne(kontingent.verbleibend)} möglich (grobe Schätzung, je
          nach Umfang).
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${knapp ? "bg-red-400" : "bg-brand-500"}`}
            style={{ width: `${prozent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs opacity-75">
          {hatZyklus ? (
            <>
              Zyklus endet am {kontingent.zyklusEnde.toLocaleDateString("de-AT")}
              {knapp && " – Kontingent für diesen Zyklus aufgebraucht."}
            </>
          ) : knapp ? (
            "Einmaliges Gratis-Kontingent aufgebraucht. Für mehr: ein Abo anfragen."
          ) : (
            "Einmaliges Gratis-Kontingent zum Ausprobieren, ohne Abo."
          )}
        </p>
      </div>
    </div>
  );
}
