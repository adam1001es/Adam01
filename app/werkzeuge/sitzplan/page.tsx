import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LayoutGrid, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SitzplanKlassenwahlPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const klassen = await prisma.klasse.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { schueler: true } } },
  });

  return (
    <main className="mx-auto max-w-xl">
      <Link
        href="/werkzeuge"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Zurück zu Werkzeuge
      </Link>
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        <LayoutGrid size={24} strokeWidth={2} /> Sitzplan-Generator
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">Für welche Klasse soll ein Sitzplan erstellt werden?</p>

      {klassen.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-amber-200 bg-surface p-10 text-center shadow-card">
          <Users className="mx-auto mb-3 text-amber-300" size={28} strokeWidth={1.5} />
          <p className="text-slate-600">
            Noch keine Klasse angelegt.{" "}
            <Link href="/klassen" className="font-medium text-amber-700 hover:underline">
              Jetzt eine Klasse anlegen
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {klassen.map((k) => (
            <li key={k.id}>
              <Link
                href={`/werkzeuge/sitzplan/${k.id}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-card-werkzeuge sm:p-5"
              >
                <div className="font-display text-base font-semibold text-slate-800 group-hover:text-amber-700">
                  {k.name}
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Users size={13} /> {k._count.schueler}{" "}
                  {k._count.schueler === 1 ? "Schüler:in" : "Schüler:innen"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
