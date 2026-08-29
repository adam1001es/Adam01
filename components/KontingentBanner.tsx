import { Gauge } from "lucide-react";
import type { Kontingent } from "@/lib/quota";
import { tierLabel } from "@/lib/quota";

export default function KontingentBanner({ kontingent }: { kontingent: Kontingent }) {
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
          <span className="font-medium">{tierLabel(kontingent.tier)}</span>
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
          {knapp && (
            <>
              {" "}
              – Kontingent für diesen Zyklus aufgebraucht
              {!kontingent.tier && ". Für mehr: ein Abo anfragen"}.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
