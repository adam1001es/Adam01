import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, GraduationCap, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { ThemenbereichSchema } from "@/lib/types";
import { THEMENBEREICHE } from "@/lib/curriculum";
import { communityAutorLabel } from "@/lib/community";
import CommunityFavoritButton from "@/components/CommunityFavoritButton";

export const dynamic = "force-dynamic";

/** Community-Übersicht: von ANDEREN zahlenden Konten für die Community freigegebene
 * Arbeitsblätter (siehe Worksheet.geteilt, app/api/worksheet/[id]/teilen) - bewusst nur unter
 * zahlenden Konten gegenseitig (istZahlendesKonto), sofort sichtbar ohne Freigabe-Workflow.
 * Eigene Arbeitsblätter erscheinen bewusst NICHT hier (die stehen bereits im eigenen
 * Dashboard) - so bleibt sofort klar, dass alles auf dieser Seite von anderen stammt. */
export default async function CommunityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (!istZahlendesKonto(user)) {
    return (
      <main>
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-10 text-center shadow-card sm:p-14">
          <Lock className="mx-auto mb-3 text-brand-300" size={32} strokeWidth={1.5} />
          <h1 className="font-display text-xl font-semibold text-slate-800">
            Community-Bereich für zahlende Konten
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Lehrkräfte mit einem Starter- oder Pro-Abo können hier gegenseitig ihre
            freigegebenen Arbeitsblätter teilen und favorisieren. Für mehr: ein Abo anfragen.
          </p>
        </div>
      </main>
    );
  }

  const geteilteWorksheets = await prisma.worksheet.findMany({
    where: { geteilt: true, userId: { not: user.id } },
    include: { user: { select: { username: true } } },
    orderBy: [{ geteiltAm: "desc" }],
    take: 100,
  });

  const favoritenRows = geteilteWorksheets.length
    ? await prisma.communityFavorit.findMany({
        where: { userId: user.id, worksheetId: { in: geteilteWorksheets.map((w) => w.id) } },
        select: { worksheetId: true },
      })
    : [];
  const favorisierteIds = new Set(favoritenRows.map((f) => f.worksheetId));

  return (
    <main>
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient px-6 py-8 shadow-card sm:px-9 sm:py-10">
        <div className="max-w-2xl">
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-semibold text-white sm:text-4xl">
            <Users size={28} strokeWidth={2} /> Community
          </h1>
          <p className="mt-2 text-sm text-brand-50/90 sm:text-base">
            Von anderen zahlenden Konten freigegebene Arbeitsblätter - als eigene Vorlage
            herunterladen oder favorisieren.
          </p>
        </div>
      </div>

      {geteilteWorksheets.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center shadow-card">
          <Users className="mx-auto mb-3 text-brand-300" size={32} strokeWidth={1.5} />
          <p className="text-slate-600">
            Noch keine Arbeitsblätter geteilt. Gib eines deiner eigenen frei (Button „Mit
            Community teilen" auf der Detailseite eines Arbeitsblatts), um die Community zu
            starten.
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
              return (
                <li key={w.id}>
                  <Link
                    href={`/worksheet/${w.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover sm:p-5"
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
                        <span>von {communityAutorLabel(w.user ?? { username: null })}</span>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
                      <Users size={13} /> Geteilt
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
