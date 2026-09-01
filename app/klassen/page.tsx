import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Lock, Users, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import NeueKlasseForm from "@/components/NeueKlasseForm";

export const dynamic = "force-dynamic";

/** Übersicht der eigenen Klassen (siehe app/klassen/[id] für Details) - wie app/community nur
 * für Abo-Konten, da mit echten Claude-Kosten (Prüfungsgenerierung) verbunden. */
export default async function KlassenPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (!istZahlendesKonto(user)) {
    return (
      <main>
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-10 text-center shadow-card sm:p-14">
          <Lock className="mx-auto mb-3 text-brand-300" size={32} strokeWidth={1.5} />
          <h1 className="font-display text-xl font-semibold text-slate-800">
            Klassen-Tracking für Abo-Konten
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Erfasse, welche Arbeitsblätter/Prüfungen eine Klasse bereits hatte, und behalte den
            Wissensstand im Überblick. Mehr dazu bei der Person, die den Zugang verwaltet.
          </p>
        </div>
      </main>
    );
  }

  const klassen = await prisma.klasse.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { schueler: true, zuweisungen: true } } },
  });

  return (
    <main>
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient px-6 py-8 shadow-card sm:px-9 sm:py-10">
        <div className="max-w-2xl">
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-semibold text-white sm:text-4xl">
            <GraduationCap size={28} strokeWidth={2} /> Deine Klassen
          </h1>
          <p className="mt-2 text-sm text-brand-50/90 sm:text-base">
            Welche Arbeitsblätter/Prüfungen hatte welche Klasse - und wie steht sie dabei? Schüler
            werden nur mit einem Kürzel geführt, nie mit echten Namen.
          </p>
          <NeueKlasseForm />
        </div>
      </div>

      {klassen.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center shadow-card">
          <GraduationCap className="mx-auto mb-3 text-brand-300" size={32} strokeWidth={1.5} />
          <p className="text-slate-600">Noch keine Klasse angelegt.</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {klassen.map((k) => (
            <li key={k.id}>
              <Link
                href={`/klassen/${k.id}`}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-base font-semibold text-slate-800 group-hover:text-brand-700">
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
