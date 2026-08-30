"use client";

import { useState } from "react";
import { Search } from "lucide-react";
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
      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        geplant ab {r.tierGueltigVon.toLocaleDateString("de-AT")}
      </span>
    );
  }
  if (r.tierGueltigBis && jetzt > r.tierGueltigBis) {
    return (
      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        abgelaufen am {r.tierGueltigBis.toLocaleDateString("de-AT")}
      </span>
    );
  }
  if (r.tierGueltigBis) {
    return (
      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
        aktiv bis {r.tierGueltigBis.toLocaleDateString("de-AT")}
      </span>
    );
  }
  return null;
}

export default function AdminUserTable({ rows }: { rows: AdminUserRow[] }) {
  const [suche, setSuche] = useState("");
  const gefiltert = rows.filter((r) =>
    r.email.toLowerCase().includes(suche.trim().toLowerCase()),
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 p-4">
        <label className="relative block max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Konto suchen (E-Mail) …"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">E-Mail</th>
              <th className="px-5 py-3 font-medium">Registriert am</th>
              <th className="px-5 py-3 font-medium">Nutzung im Zyklus</th>
              <th className="px-5 py-3 font-medium">Gesamt erstellt</th>
              <th className="px-5 py-3 font-medium">Abo</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {gefiltert.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3">
                  {r.email}
                  {r.role === "admin" && (
                    <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {r.createdAt.toLocaleDateString("de-AT")}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {r.limit === null ? `${r.verbraucht} / unbegrenzt` : `${r.verbraucht} / ${r.limit}`}
                </td>
                <td className="px-5 py-3 text-slate-500">{r.gesamtErstellt}</td>
                <td className="px-5 py-3">
                  <AdminTierForm
                    userId={r.id}
                    initialTier={r.tier}
                    initialGueltigVon={r.tierGueltigVon}
                    initialGueltigBis={r.tierGueltigBis}
                  />
                  <GueltigkeitsBadge r={r} />
                </td>
                <td className="px-5 py-3 text-right">
                  {!r.istSelbst && <AdminDeleteUserButton userId={r.id} email={r.email} />}
                </td>
              </tr>
            ))}
            {gefiltert.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                  Kein Konto gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
