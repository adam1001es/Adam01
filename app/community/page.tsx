import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, GraduationCap, Lock, Search, Sparkles } from "lucide-react";
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
import AvatarKreis from "@/components/AvatarKreis";
import { avatarAnzeige } from "@/lib/profil";
import { istGueltigerStatus, type NutzerStatus } from "@/lib/status";
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

  // Bewusst KEIN Zugriffs-Lock mehr für das Ansehen der Liste (siehe app/worksheet/[id]/page.tsx
  // für die weiterhin serverseitig durchgesetzte Zugriffsprüfung beim ÖFFNEN): kostenlose Konten
  // sollen sehen, welche Arbeitsblätter andere Lehrkräfte geteilt haben, dürfen sie aber nicht
  // öffnen (kannOeffnen unten, pro Karte außer bei eigenen Arbeitsblättern).
  const kannOeffnen = istZahlendesKonto(user);

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
    include: {
      user: {
        select: {
          username: true,
          avatarFarbe: true,
          avatarTextFarbe: true,
          avatarKuerzel: true,
          status: true,
        },
      },
    },
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

      {!kannOeffnen && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-3.5 text-sm text-brand-800">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <p>
            Du siehst hier bereits alle geteilten Arbeitsblätter. Zum Öffnen, Herunterladen und
            Favorisieren brauchst du ein Abo.
          </p>
        </div>
      )}

      <details open={filterAktiv} className="group mt-6">
        <summary
          className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-slate-500 shadow-card transition hover:border-brand-300 hover:text-brand-700 [&::-webkit-details-marker]:hidden"
        >
          <Search size={15} />
          Suchen &amp; filtern
          {filterAktiv && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              aktiv
            </span>
          )}
        </summary>
        <form
          method="GET"
          className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-surface p-4 shadow-card"
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
      </details>

      {geteilteWorksheets.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-brand-200 bg-surface p-12 text-center shadow-card">
          <Users className="mx-auto mb-3 text-brand-300" size={32} strokeWidth={1.5} />
          <p className="text-slate-600">
            {filterAktiv ? (
              "Keine geteilten Arbeitsblätter zu diesen Filtern gefunden."
            ) : (
              <>
                Noch keine Arbeitsblätter geteilt. Gib eines deiner eigenen frei (Button
                „Für Community teilen" auf der Detailseite eines Arbeitsblatts), um den Anfang zu
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
          <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {geteilteWorksheets.map((w) => {
              const themenbereich = ThemenbereichSchema.catch("gemischt").parse(w.themenbereich);
              const istEigenes = w.userId === user.id;
              // Ein eigenes Arbeitsblatt bleibt immer öffenbar (Besitz-Zugriff in
              // app/worksheet/[id]/page.tsx greift unabhängig vom Abo-Status) - nur fremde
              // geteilte Arbeitsblätter sind für kostenlose Konten nur zum Ansehen, nicht zum
              // Öffnen gedacht.
              const kannDiesesOeffnen = istEigenes || kannOeffnen;
              const autor = w.user ?? { username: null, avatarFarbe: null, avatarTextFarbe: null, avatarKuerzel: null, status: null };
              const autorStatus = autor.status && istGueltigerStatus(autor.status) ? (autor.status as NutzerStatus) : null;
              const kartenInhalt = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                        istEigenes
                          ? "bg-gold-50 text-gold-700 ring-gold-200"
                          : "bg-brand-50 text-brand-700 ring-brand-200"
                      }`}
                    >
                      <Users size={13} /> {istEigenes ? "Von dir geteilt" : "Geteilt"}
                    </span>
                    {kannDiesesOeffnen ? (
                      <CommunityFavoritButton
                        worksheetId={w.id}
                        initialFavorit={favorisierteIds.has(w.id)}
                      />
                    ) : (
                      <span
                        title="Nur mit Abo zu öffnen"
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-400"
                      >
                        <Lock size={12} strokeWidth={2.25} />
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex-1 font-display text-lg font-semibold leading-snug text-slate-800 group-hover:text-brand-700">
                    {w.thema}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap size={13} /> {w.schulstufe}
                    </span>
                    <span>{THEMENBEREICHE[themenbereich].label}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    {istEigenes ? (
                      <span className="text-sm font-medium text-gold-700">Von dir</span>
                    ) : (
                      <>
                        <AvatarKreis
                          anzeige={avatarAnzeige(autor.avatarKuerzel, autor.username)}
                          farbe={autor.avatarFarbe ?? "#0f766e"}
                          textFarbe={autor.avatarTextFarbe ?? "#ffffff"}
                          status={autorStatus}
                          size={26}
                        />
                        <span className="truncate text-sm text-slate-600" dir="auto">
                          {communityAutorLabel(autor)}
                        </span>
                      </>
                    )}
                  </div>
                </>
              );
              const kartenClass = `group flex h-full flex-col rounded-2xl border bg-surface p-5 shadow-card transition ${
                istEigenes ? "border-gold-200" : "border-slate-200"
              } ${
                kannDiesesOeffnen
                  ? "hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover"
                  : ""
              }`;
              return (
                <li key={w.id}>
                  {kannDiesesOeffnen ? (
                    <Link href={`/worksheet/${w.id}`} className={kartenClass}>
                      {kartenInhalt}
                    </Link>
                  ) : (
                    <div className={kartenClass} title="Zum Öffnen ist ein Abo nötig">
                      {kartenInhalt}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
