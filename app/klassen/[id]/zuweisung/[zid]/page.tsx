import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import ErgebnisseForm from "@/components/ErgebnisseForm";

export const dynamic = "force-dynamic";

export default async function ErgebnisseSeite({
  params,
}: {
  params: { id: string; zid: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!istZahlendesKonto(user)) redirect("/klassen");

  const zuweisung = await prisma.zuweisung.findUnique({
    where: { id: params.zid },
    include: { klasse: true, ergebnisse: true },
  });
  if (!zuweisung || zuweisung.klasseId !== params.id || zuweisung.klasse.userId !== user.id) {
    notFound();
  }

  const schueler = await prisma.schueler.findMany({
    where: { klasseId: zuweisung.klasseId },
    orderBy: { createdAt: "asc" },
  });

  const ergebnisNachSchueler = new Map(zuweisung.ergebnisse.map((e) => [e.schuelerId, e]));

  return (
    <main className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-slate-800">Ergebnisse</h1>
      <p className="mt-1 text-sm text-slate-500">
        „{zuweisung.titel}" · {zuweisung.klasse.name}
        {zuweisung.istPruefung && zuweisung.punkteGesamt
          ? ` · Prüfung mit ${zuweisung.punkteGesamt} Punkten`
          : ""}
      </p>
      <div className="mt-6 rounded-2xl border border-emerald-100 bg-surface p-6 shadow-card-klassen">
        {schueler.length === 0 ? (
          <p className="text-sm text-slate-400">
            Noch keine Schüler:innen in dieser Klasse erfasst.
          </p>
        ) : (
          <ErgebnisseForm
            klasseId={zuweisung.klasseId}
            zuweisungId={zuweisung.id}
            schueler={schueler.map((s) => ({
              id: s.id,
              label: s.label,
              prozent: ergebnisNachSchueler.get(s.id)?.prozent ?? null,
              notiz: ergebnisNachSchueler.get(s.id)?.notiz ?? "",
            }))}
          />
        )}
      </div>
    </main>
  );
}
