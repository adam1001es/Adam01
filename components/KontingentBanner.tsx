import { AlertTriangle, Gauge } from "lucide-react";
import type { Kontingent } from "@/lib/quota";
import { TIER_LABEL } from "@/lib/quota";

export default function KontingentBanner({ kontingent }: { kontingent: Kontingent }) {
  if (!kontingent.tier) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div>
          <div className="font-medium">Kein aktives Abo</div>
          <p className="mt-0.5">
            Dein Konto hat noch kein Arbeitsblatt-Kontingent. Wende dich an die Person, die den
            Zugang verwaltet, um dein Abo zu aktivieren.
          </p>
        </div>
      </div>
    );
  }

  const prozent = Math.min(100, Math.round((kontingent.verbraucht / kontingent.limit) * 100));
  const knapp = kontingent.verbleibend === 0;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm shadow-sm ${
        knapp ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      <Gauge size={18} className="mt-0.5 shrink-0" />
      <div className="w-full">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="font-medium">{TIER_LABEL[kontingent.tier]}</span>
          <span>
            {kontingent.verbraucht} / {kontingent.limit} Arbeitsblätter in diesem Zyklus
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${knapp ? "bg-red-400" : "bg-brand-500"}`}
            style={{ width: `${prozent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs opacity-75">
          Zyklus endet am {kontingent.zyklusEnde.toLocaleDateString("de-AT")}
          {knapp && " – Kontingent für diesen Zyklus aufgebraucht."}
        </p>
      </div>
    </div>
  );
}
