import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, NotebookPen } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { holeKalenderVarianteAsync } from "@/lib/jahresplanVarianten";
import JahresplanEditor from "@/components/JahresplanEditor";

export const dynamic = "force-dynamic";

export default async function JahresplanDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const jahresplan = await prisma.jahresplan.findUnique({
    where: { id: params.id },
    include: { wochen: true },
  });
  if (!jahresplan || jahresplan.userId !== user.id) notFound();

  const variante = await holeKalenderVarianteAsync(jahresplan.variante);
  if (!variante) notFound();

  return (
    <main>
      <Link
        href="/werkzeuge/jahresplanung"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Zurück zur Übersicht
      </Link>
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        <NotebookPen size={24} strokeWidth={2} /> {jahresplan.gruppe}
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Schuljahr {variante.schuljahr} · {variante.label}
        {jahresplan.erstelltVon && <> · Erstellt von {jahresplan.erstelltVon}</>}
      </p>
      {jahresplan.bemerkungenGruppe && (
        <p className="mt-1 text-sm text-slate-500">Bemerkungen: {jahresplan.bemerkungenGruppe}</p>
      )}
      {jahresplan.speziellerFokus && (
        <p className="mt-1 text-sm text-slate-500">Spezieller Fokus: {jahresplan.speziellerFokus}</p>
      )}

      <div className="mt-6">
        <JahresplanEditor
          jahresplanId={jahresplan.id}
          kalenderWochen={variante.wochen}
          eintraege={jahresplan.wochen}
        />
      </div>
    </main>
  );
}
