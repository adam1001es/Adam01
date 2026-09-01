import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, GraduationCap, Lock, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { ThemenbereichSchema } from "@/lib/types";
import {
  THEMENBEREICHE,
  THEMENBEREICH_KEYS,
  ThemenbereichKey,
  SCHULSTUFEN_CLUSTER,
  guessSchulstufenCluster,
} from "@/lib/curriculum";
import { communityAutorLabel } from "@/lib/community";
import CommunityFavoritButton from "@/components/CommunityFavoritButton";
import { inputClass } from "@/lib/formStyles";

export const dynamic = "force-dynamic";

/** Übersicht "Geteilte Arbeitsblätter": alle von Lehrkräften freigegebenen Arbeitsblätter (siehe
 * Worksheet.geteilt, app/api/worksheet/[id]/teilen) - bewusst nur unter Abo-Konten gegenseitig
 * (istZahlendesKonto), sofort sichtbar ohne Freigabe-Workflow. Enthält auch die
 * EIGENEN geteilten Arbeitsblätter (klar als "Von dir" markiert statt Autorenname), damit man
 * hier auf einen Blick sieht, was man selbst freigegeben hat - nicht nur, was andere geteilt
 * haben. Filter über ein simples GET-Formular (Suchparameter in der URL) statt Client-State,
 * damit die Seite ohne JavaScript funktioniert und Filterzustände direkt verlinkbar sind. */
export default async function CommunityPage({
  searchParams,
}: {
  searchParams: { themenbereich?: string; schulstufe?: string; suche?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (!istZahlendesKonto(user)) {
    return (
      <main>
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-10 text-center shadow-card sm:p-14">
          <Lock className="mx-auto mb-3 text-brand-300" size={32} strokeWidth={1.5} />
          <h1 className="font-display text-xl font-semibold text-slate-800">
            Geteilte Arbeitsblätter für Abo-Konten
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Lehrkräfte mit einem Abo können hier gegenseitig ihre freigegebenen Arbeitsblätter
            teilen und favorisieren. Mehr dazu bei der Person, die den Zugang verwaltet.
          </p>
        </div>
      </main>
    );
  }

  const themenbereichFilter = THEMENBEREICH_KEYS.includes(
    searchParams.themenbereich as ThemenbereichKey,
  )
    ? (searchParams.themenbereich as ThemenbereichKey)
    : null;
  const schulstufeFilter = SCHULSTUFEN_CLUSTER.some((c) => c.id === searchParams.schulstufe)
    ? searchParams.schulstufe
    : null;
  const sucheFilter = searchParams.suche?.trim() || null;

  const alleGeteiltenWorksheets = await prisma.worksheet.findMany({
    where: {
      geteilt: true,
      ...(themenbereichFilter ? { themenbereich: themenbereichFilter } : {}),
      ...(sucheFilter ? { thema: { contains: sucheFilter, mode: "insensitive" } } : {}),
    },
    include: { user: { select: { username: true } } },
    orderBy: [{ geteiltAm: "desc" }],
    take: 300,
  });

  // Schulstufen-Cluster ist keine eigene Spalte (Worksheet.schulstufe ist Freitext, siehe
  // guessSchulstufenCluster) - daher erst laden, dann in JS filtern statt per Datenbank-Query.
  // Bei der überschaubaren Datenmenge geteilter Arbeitsblätter unproblematisch.
  const geteilteWorksheets = schulstufeFilter
    ? alleGeteiltenWorksheets.filter(
        (w) => guessSchulstufenCluster(w.schulstufe).id === schulstufeFilter,
      )
    : alleGeteiltenWorksheets;

  const favoritenRows = geteilteWorksheets.length
    ? await prisma.communityFavorit.findMany({
        where: { userId: user.id, worksheetId: { in: geteilteWorksheets.map((w) => w.id) } },
        select: { worksheetId: true },
      })
    : [];
  const favorisierteIds = new Set(favoritenRows.map((f) => f.worksheetId));

  const filterAktiv = !!(themenbereichFilter || schulstufeFilter || sucheFilter);

  return (
    <main>
      <div className="relative overflow-hidden rounded-2xl bg-community-gradient px-6 py-8 shadow-card sm:px-9 sm:py-10">
        <div className="max-w-2xl">
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-semibold text-white sm:text-4xl">
            <Users size={28} strokeWidth={2} /> Arbeitsblätter von anderen Lehrkräften
          </h1>
          <p className="mt-2 text-sm text-brand-50/90 sm:text-base">
            Von anderen Abo-Konten freigegebene Arbeitsblätter - als eigene Vorlage
            herunterladen oder favorisieren.
          </p>
        </div>
      </div>

      <form
        method="GET"
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-500">Thema durchsuchen</span>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="suche"
              defaultValue={sucheFilter ?? ""}
              placeholder="z.B. Ramadan"
              className={`${inputClass} w-52 pl-8`}
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-500">Grundkompetenz</span>
          <select name="themenbereich" defaultValue={themenbereichFilter ?? ""} className={`${inputClass} w-56`}>
            <option value="">Alle</option>
            {THEMENBEREICH_KEYS.map((key) => (
              <option key={key} value={key}>
                {THEMENBEREICHE[key].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-500">Schulstufe</span>
          <select name="schulstufe" defaultValue={schulstufeFilter ?? ""} className={`${inputClass} w-52`}>
            <option value="">Alle</option>
            {SCHULSTUFEN_CLUSTER.map((cluster) => (
              <option key={cluster.id} value={cluster.id}>
                {cluster.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-community-gradient px-4 py-2.5 text-sm font-medium text-white shadow-card transition hover:shadow-card-hover"
        >
          Filtern
        </button>
        {filterAktiv && (
          <Link
            href="/community"
            className="text-sm font-medium text-slate-500 hover:text-brand-700"
          >
            Filter zurücksetzen
          </Link>
        )}
      </form>

      {geteilteWorksheets.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center shadow-card">
          <Users className="mx-auto mb-3 text-brand-300" size={32} strokeWidth={1.5} />
          <p className="text-slate-600">
            {filterAktiv ? (
              "Keine geteilten Arbeitsblätter zu diesen Filtern gefunden."
            ) : (
              <>
                Noch keine Arbeitsblätter geteilt. Gib eines deiner eigenen frei (Button
                „Arbeitsblatt teilen" auf der Detailseite eines Arbeitsblatts), um den Anfang zu
                machen.
              </>
            )}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-8 text-sm text-slate-500">
            {geteilteWorksheets.length}{" "}
            {geteilteWorksheets.length === 1 ? "geteiltes Arbeitsblatt" : "geteilte Arbeitsblätter"}
          </p>
          <ul className="mt-3 space-y-3">
            {geteilteWorksheets.map((w) => {
              const themenbereich = ThemenbereichSchema.catch("gemischt").parse(w.themenbereich);
              const istEigenes = w.userId === user.id;
              return (
                <li key={w.id}>
                  <Link
                    href={`/worksheet/${w.id}`}
                    className={`group flex items-center gap-3 rounded-xl border bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover sm:p-5 ${
                      istEigenes ? "border-gold-200" : "border-slate-200"
                    }`}
                  >
                    <CommunityFavoritButton
                      worksheetId={w.id}
                      initialFavorit={favorisierteIds.has(w.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-base font-semibold text-slate-800 group-hover:text-brand-700">
                        {w.thema}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap size={13} /> {w.schulstufe}
                        </span>
                        <span>{THEMENBEREICHE[themenbereich].label}</span>
                        {istEigenes ? (
                          <span className="font-medium text-gold-700">Von dir</span>
                        ) : (
                          <span>von {communityAutorLabel(w.user ?? { username: null })}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                        istEigenes
                          ? "bg-gold-50 text-gold-700 ring-gold-200"
                          : "bg-brand-50 text-brand-700 ring-brand-200"
                      }`}
                    >
                      <Users size={13} /> {istEigenes ? "Von dir geteilt" : "Geteilt"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
