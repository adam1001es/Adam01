import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, NotebookPen, Plus } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { holeAlleVarianten } from "@/lib/jahresplanVarianten";
import EinfacherLoeschButton from "@/components/EinfacherLoeschButton";

export const dynamic = "force-dynamic";

/** Übersicht der eigenen Jahresplanungen (siehe lib/jahresplan.ts) - eine Dienstpflicht laut
 * Fachinspektor-Unterlagen des Schulamts der IGGÖ, daher meist eine pro
 * Religionsunterrichtsgruppe/Schuljahr, nicht nur eine einzige. */
export default async function JahresplanungPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [jahresplaene, alleVarianten] = await Promise.all([
    prisma.jahresplan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    holeAlleVarianten(),
  ]);
  const variantenNachId = new Map(alleVarianten.map((v) => [v.id, v]));

  return (
    <main className="mx-auto max-w-2xl">
      <Link
        href="/werkzeuge"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Zurück zu Werkzeuge
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
          <NotebookPen size={24} strokeWidth={2} /> Jahresplanung
        </h1>
        <Link
          href="/werkzeuge/jahresplanung/neu"
          className="inline-flex items-center gap-1.5 rounded-full bg-werkzeuge-gradient px-4 py-2 text-sm font-medium text-white shadow-card-werkzeuge transition hover:shadow-card-werkzeuge-hover"
        >
          <Plus size={15} /> Neue Jahresplanung
        </Link>
      </div>
      <p className="mt-1.5 text-sm text-slate-500">
        Wochenraster nach Vorlage des Schulamts der IGGÖ - Wochendatum, Hijri-Datum und Ferien/
        Feiertage sind vorausgefüllt, Wochenthema, Kompetenzen und Notizen trägst du selbst ein.
      </p>

      {jahresplaene.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Noch keine Jahresplanung angelegt.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {jahresplaene.map((j) => {
            const variante = variantenNachId.get(j.variante);
            return (
              <li key={j.id}>
                <Link
                  href={`/werkzeuge/jahresplanung/${j.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-card-werkzeuge sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base font-semibold text-slate-800 group-hover:text-amber-700">
                      {j.gruppe}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {variante ? `Schuljahr ${variante.schuljahr} · ${variante.label}` : "Unbekannte Vorlage"}
                    </p>
                  </div>
                  <EinfacherLoeschButton
                    url={`/api/jahresplaene/${j.id}`}
                    bestaetigung={`Jahresplanung "${j.gruppe}" wirklich löschen?`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
