import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Info } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { kommendeFeiertage } from "@/lib/islamischeFeiertage";
import { toHijri } from "@/lib/hijri";

export const dynamic = "force-dynamic";

export default async function KalenderPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const feiertage = kommendeFeiertage();

  return (
    <main className="mx-auto max-w-2xl">
      <Link
        href="/werkzeuge"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Zurück zu Werkzeuge
      </Link>
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        <CalendarDays size={24} strokeWidth={2} /> Islamischer Schuljahres-Kalender
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Nächste Termine, berechnet ab heute ({toHijri(new Date()).label}) - zur groben
        Unterrichtsplanung.
      </p>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-3.5 text-sm text-amber-800">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>
          Berechnet nach dem tabellarischen ("zivilen") Hijri-Kalender - das tatsächliche, lokal
          gefeierte Datum kann je nach Mondsichtung um einen Tag abweichen. Keine religiöse
          Rechtsauskunft, nur eine verlässliche Näherung für die Planung.
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {feiertage.map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-surface p-4 shadow-sm sm:p-5"
          >
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-50 text-amber-800">
              <span className="text-xs font-medium uppercase leading-none">
                {f.datum.toLocaleDateString("de-AT", { month: "short" })}
              </span>
              <span className="font-display text-xl font-semibold leading-tight">
                {f.datum.getDate()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-base font-semibold text-slate-800">{f.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">
                {f.datum.toLocaleDateString("de-AT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {" · "}
                {toHijri(f.datum).label}
              </div>
              {f.hinweis && <p className="mt-1 text-xs text-slate-400">{f.hinweis}</p>}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
