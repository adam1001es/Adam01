"use client";

import { useState } from "react";
import { Search, GraduationCap, ChevronDown } from "lucide-react";
import AdminTierForm from "@/components/AdminTierForm";
import AdminDeleteUserButton from "@/components/AdminDeleteUserButton";
import AvatarKreis from "@/components/AvatarKreis";
import { avatarAnzeige } from "@/lib/profil";

export interface AdminUserRow {
  id: string;
  email: string;
  username: string | null;
  avatarFarbe: string;
  avatarTextFarbe: string;
  avatarKuerzel: string | null;
  /** Tatsächliche Aktivität (User.letzteAktivitaet, siehe istKuerzlichAktiv in lib/status.ts) -
   * NICHT der selbst gewählte NUTZER_STATUS (der ist für Forum/Chat/Community gedacht, hier auf
   * der Admin-Seite interessiert die Wahrheit statt der Selbstauskunft). */
  wirklichOnline: boolean;
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

// "starter" bleibt als Anzeige-Alias bestehen - reine Abwärtskompatibilität für Konten, die vor
// der Umstellung auf ein einziges Abo noch "starter" zugewiesen bekamen (siehe lib/quota.ts).
const PAKET_LABEL: Record<string, string> = { starter: "Abo", pro: "Abo" };

function AdminKontoZeile({ r }: { r: AdminUserRow }) {
  const [offen, setOffen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setOffen((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-2 p-3.5 text-left sm:p-4"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <AvatarKreis
            anzeige={avatarAnzeige(r.avatarKuerzel, r.username)}
            farbe={r.avatarFarbe}
            textFarbe={r.avatarTextFarbe}
            status={r.wirklichOnline ? "online" : "offline"}
            size={32}
          />
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-800" dir="auto">
              {r.username ?? r.email}
            </div>
            {r.username && (
              <div className="truncate text-xs text-slate-400">{r.email}</div>
            )}
          </div>
          {r.role === "admin" && (
            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              Admin
            </span>
          )}
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {r.tier ? PAKET_LABEL[r.tier] : "Kostenlos"}
          </span>
          <GueltigkeitsBadge r={r} />
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
          <span>
            {r.limit === null ? `${r.verbraucht} / unbegrenzt` : `${r.verbraucht} / ${r.limit}`} Punkte
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-slate-400 transition-transform ${offen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {offen && (
        <div className="border-t border-slate-100 p-3.5 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <GraduationCap size={13} /> registriert am {r.createdAt.toLocaleDateString("de-AT")}
              </span>
              <span>{r.gesamtErstellt} insgesamt erstellt</span>
            </div>
            {!r.istSelbst && <AdminDeleteUserButton userId={r.id} email={r.email} />}
          </div>
          <AdminTierForm
            userId={r.id}
            initialTier={r.tier}
            initialGueltigVon={r.tierGueltigVon}
            initialGueltigBis={r.tierGueltigBis}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminUserTable({ rows }: { rows: AdminUserRow[] }) {
  const [suche, setSuche] = useState("");
  const suchbegriff = suche.trim().toLowerCase();
  const gefiltert = rows.filter(
    (r) =>
      r.email.toLowerCase().includes(suchbegriff) ||
      r.username?.toLowerCase().includes(suchbegriff),
  );

  return (
    <div>
      <label className="relative mb-4 block max-w-xs">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Konto suchen (E-Mail oder Name) …"
          className="w-full rounded-lg border border-slate-300 bg-surface py-2 pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <p className="mb-4 text-xs text-slate-400">
        Der Punkt am Profilbild zeigt die tatsächliche Aktivität (grün = zuletzt aktiv vor
        weniger als 3 Minuten) - unabhängig vom Status, den sich Nutzer:innen selbst im Profil
        aussuchen können.
      </p>

      <div className="space-y-2">
        {gefiltert.map((r) => (
          <AdminKontoZeile key={r.id} r={r} />
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
