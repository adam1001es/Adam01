import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Users, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import NeueKlasseForm from "@/components/NeueKlasseForm";

export const dynamic = "force-dynamic";

/** Übersicht der eigenen Klassen (siehe app/klassen/[id] für Details) - für ALLE eingeloggten
 * Konten frei zugänglich (echte Claude-Kosten für die Prüfungsgenerierung laufen ohnehin über
 * das normale Punkte-Kontingent, das auch kostenlose Konten einmalig haben, siehe lib/quota.ts).
 * Einzige Einschränkung für kostenlose Konten: fremde geteilte Arbeitsblätter lassen sich nicht
 * zuweisen (siehe app/klassen/[id]/zuweisen/page.tsx). */
export default async function KlassenPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const klassen = await prisma.klasse.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { schueler: true, zuweisungen: true } } },
  });

  return (
    <main>
      <div className="relative overflow-hidden rounded-2xl bg-klassen-gradient px-6 py-8 shadow-card-klassen sm:px-9 sm:py-10">
        <div className="max-w-2xl">
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-semibold text-white sm:text-4xl">
            <GraduationCap size={28} strokeWidth={2} /> Deine Klassen
          </h1>
          <p className="mt-2 text-sm text-emerald-50/90 sm:text-base">
            Welche Arbeitsblätter/Prüfungen hatte welche Klasse - und wie steht sie dabei? Schüler
            werden nur mit einem Kürzel geführt, nie mit echten Namen.
          </p>
          <NeueKlasseForm />
        </div>
      </div>

      {klassen.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-emerald-200 bg-surface p-12 text-center shadow-card-klassen">
          <GraduationCap className="mx-auto mb-3 text-emerald-300" size={32} strokeWidth={1.5} />
          <p className="text-slate-600">Noch keine Klasse angelegt.</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {klassen.map((k) => (
            <li key={k.id}>
              <Link
                href={`/klassen/${k.id}`}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-surface p-4 shadow-card-klassen transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-card-klassen-hover sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-base font-semibold text-slate-800 group-hover:text-emerald-700">
                    {k.name}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {k.schulstufe && <span>{k.schulstufe}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Users size={13} /> {k._count.schueler}{" "}
                      {k._count.schueler === 1 ? "Schüler:in" : "Schüler:innen"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClipboardList size={13} /> {k._count.zuweisungen}{" "}
                      {k._count.zuweisungen === 1 ? "Zuweisung" : "Zuweisungen"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
