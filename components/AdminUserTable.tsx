"use client";

import { useState } from "react";
import { Search, GraduationCap } from "lucide-react";
import AdminTierForm from "@/components/AdminTierForm";
import AdminDeleteUserButton from "@/components/AdminDeleteUserButton";

export interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  tier: string | null;
  tierGueltigVon: Date | null;
  tierGueltigBis: Date | null;
  createdAt: Date;
  verbraucht: number;
  /** null = unbegrenztes Kontingent (Admin-Konto). */
  limit: number | null;
  gesamtErstellt: number;
  istSelbst: boolean;
}

function GueltigkeitsBadge({ r }: { r: AdminUserRow }) {
  if (!r.tier) return null;
  const jetzt = new Date();
  if (r.tierGueltigVon && jetzt < r.tierGueltigVon) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        geplant ab {r.tierGueltigVon.toLocaleDateString("de-AT")}
      </span>
    );
  }
  if (r.tierGueltigBis && jetzt > r.tierGueltigBis) {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        abgelaufen am {r.tierGueltigBis.toLocaleDateString("de-AT")}
      </span>
    );
  }
  if (r.tierGueltigBis) {
    return (
      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
        aktiv bis {r.tierGueltigBis.toLocaleDateString("de-AT")}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
      unbefristet aktiv
    </span>
  );
}

export default function AdminUserTable({ rows }: { rows: AdminUserRow[] }) {
  const [suche, setSuche] = useState("");
  const gefiltert = rows.filter((r) =>
    r.email.toLowerCase().includes(suche.trim().toLowerCase()),
  );

  return (
    <div>
      <label className="relative mb-4 block max-w-xs">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Konto suchen (E-Mail) …"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <div className="space-y-3">
        {gefiltert.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
                  {r.email}
                  {r.role === "admin" && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      Admin
                    </span>
                  )}
                  <GueltigkeitsBadge r={r} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap size={13} /> registriert am {r.createdAt.toLocaleDateString("de-AT")}
                  </span>
                  <span>
                    {r.limit === null ? `${r.verbraucht} / unbegrenzt` : `${r.verbraucht} / ${r.limit}`} in
                    diesem Zyklus
                  </span>
                  <span>{r.gesamtErstellt} insgesamt erstellt</span>
                </div>
              </div>
              {!r.istSelbst && <AdminDeleteUserButton userId={r.id} email={r.email} />}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <AdminTierForm
                userId={r.id}
                initialTier={r.tier}
                initialGueltigVon={r.tierGueltigVon}
                initialGueltigBis={r.tierGueltigBis}
              />
            </div>
          </div>
        ))}
        {gefiltert.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-slate-400">
            Kein Konto gefunden.
          </p>
        )}
      </div>
    </div>
  );
}
