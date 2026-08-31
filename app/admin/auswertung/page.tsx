import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, GraduationCap, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { THEMENBEREICHE, SCHULSTUFEN_CLUSTER, guessSchulstufenCluster } from "@/lib/curriculum";
import { ThemenbereichSchema } from "@/lib/types";

export const dynamic = "force-dynamic";

function Balkenliste({ zeilen }: { zeilen: { label: string; anzahl: number }[] }) {
  const maxAnzahl = Math.max(1, ...zeilen.map((z) => z.anzahl));
  return (
    <ul className="space-y-2.5">
      {zeilen.map((z) => (
        <li key={z.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-slate-700">{z.label}</span>
            <span className="shrink-0 font-medium text-slate-500">{z.anzahl}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${Math.round((z.anzahl / maxAnzahl) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Auswertung, welche Themen(bereiche)/Schulstufen am häufigsten generiert werden und welche
 * geteilten Arbeitsblätter in der Community am meisten favorisiert sind - hilft einzuschätzen,
 * wo der Bedarf der Lehrkräfte tatsächlich liegt (z.B. für künftige Lehrplan-Vertiefungen). Rein
 * lesend, ändert nichts. */
export default async function AuswertungPage() {
  const admin = await getSessionUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/");

  const [themenbereichGruppen, alleSchulstufen, geteilteMitFavoriten] = await Promise.all([
    prisma.worksheet.groupBy({
      by: ["themenbereich"],
      _count: { _all: true },
      orderBy: { _count: { themenbereich: "desc" } },
    }),
    prisma.worksheet.findMany({ select: { schulstufe: true } }),
    prisma.worksheet.findMany({
      where: { geteilt: true },
      select: {
        id: true,
        thema: true,
        _count: { select: { communityFavoriten: true } },
      },
    }),
  ]);

  const themenbereichZeilen = themenbereichGruppen
    .map((g) => {
      const key = ThemenbereichSchema.catch("gemischt").parse(g.themenbereich);
      return { label: THEMENBEREICHE[key].label, anzahl: g._count._all };
    })
    // Mehrere legacy-Werte können nach dem Fallback auf denselben Label-Text zusammenfallen -
    // Anzahlen dabei zusammenführen statt doppelte Zeilen anzuzeigen.
    .reduce<{ label: string; anzahl: number }[]>((acc, zeile) => {
      const bestehende = acc.find((z) => z.label === zeile.label);
      if (bestehende) bestehende.anzahl += zeile.anzahl;
      else acc.push({ ...zeile });
      return acc;
    }, [])
    .sort((a, b) => b.anzahl - a.anzahl);

  const schulstufenZaehler = new Map<string, number>();
  for (const { schulstufe } of alleSchulstufen) {
    const clusterId = guessSchulstufenCluster(schulstufe).id;
    schulstufenZaehler.set(clusterId, (schulstufenZaehler.get(clusterId) ?? 0) + 1);
  }
  const schulstufenZeilen = SCHULSTUFEN_CLUSTER.map((cluster) => ({
    label: cluster.label,
    anzahl: schulstufenZaehler.get(cluster.id) ?? 0,
  })).sort((a, b) => b.anzahl - a.anzahl);

  const topFavorisiert = geteilteMitFavoriten
    .filter((w) => w._count.communityFavoriten > 0)
    .sort((a, b) => b._count.communityFavoriten - a._count.communityFavoriten)
    .slice(0, 10);

  return (
    <main>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <BarChart3 size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Auswertung</h1>
          <p className="text-sm text-slate-500">
            Welche Themen, Grundkompetenzen und Schulstufen tatsächlich genutzt werden.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-base font-semibold text-slate-800">
            Grundkompetenzen (alle Arbeitsblätter)
          </h2>
          {themenbereichZeilen.length > 0 ? (
            <Balkenliste zeilen={themenbereichZeilen} />
          ) : (
            <p className="text-sm text-slate-400">Noch keine Arbeitsblätter erstellt.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-base font-semibold text-slate-800">
            Schulstufen (alle Arbeitsblätter)
          </h2>
          {schulstufenZeilen.some((z) => z.anzahl > 0) ? (
            <Balkenliste zeilen={schulstufenZeilen} />
          ) : (
            <p className="text-sm text-slate-400">Noch keine Arbeitsblätter erstellt.</p>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 flex items-center gap-1.5 font-display text-base font-semibold text-slate-800">
          <Star size={16} className="text-amber-500" /> Meistfavorisiert in der Community
        </h2>
        {topFavorisiert.length > 0 ? (
          <ul className="space-y-2">
            {topFavorisiert.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/worksheet/${w.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-brand-50"
                >
                  <span className="flex items-center gap-1.5 truncate text-slate-700">
                    <GraduationCap size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{w.thema}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 font-medium text-amber-600">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    {w._count.communityFavoriten}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            Noch keine geteilten Arbeitsblätter favorisiert.
          </p>
        )}
      </div>
    </main>
  );
}
