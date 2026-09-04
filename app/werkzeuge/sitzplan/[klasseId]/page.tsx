import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import SitzplanGenerator from "@/components/SitzplanGenerator";

export const dynamic = "force-dynamic";

export default async function SitzplanPage({ params }: { params: { klasseId: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const klasse = await prisma.klasse.findUnique({ where: { id: params.klasseId } });
  if (!klasse || klasse.userId !== user.id) notFound();

  const schueler = await prisma.schueler.findMany({
    where: { klasseId: klasse.id },
    orderBy: { createdAt: "asc" },
    select: { label: true },
  });

  return (
    <main className="mx-auto max-w-3xl">
      <Link
        href="/werkzeuge/sitzplan"
        className="no-print mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Andere Klasse wählen
      </Link>
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        <LayoutGrid size={24} strokeWidth={2} /> Sitzplan „{klasse.name}"
      </h1>
      <p className="no-print mt-1.5 text-sm text-slate-500">
        Zufällige Sitzordnung - Spaltenzahl anpassen, neu mischen, drucken. Wird nicht gespeichert.
      </p>

      <div className="mt-6">
        <SitzplanGenerator schuelerLabels={schueler.map((s) => s.label)} />
      </div>
    </main>
  );
}
