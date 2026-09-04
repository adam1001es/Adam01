import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StundenplanEditor from "@/components/StundenplanEditor";

export const dynamic = "force-dynamic";

/** Persönlicher Stundenplan-Generator (siehe app/werkzeuge/page.tsx) - für jedes eingeloggte
 * Konto frei nutzbar, kein KI-Aufruf/Kontingent. Reine Verwaltungsdaten (siehe
 * StundenplanEintrag im Prisma-Schema), daher direkter prisma-Zugriff statt eines
 * GET-API-Endpunkts, analog zu app/klassen/page.tsx. */
export default async function StundenplanPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const eintraege = await prisma.stundenplanEintrag.findMany({
    where: { userId: user.id },
    orderBy: [{ wochentag: "asc" }, { beginn: "asc" }],
  });

  return (
    <main>
      <Link
        href="/werkzeuge"
        className="no-print mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Zurück zu Werkzeuge
      </Link>
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        <CalendarClock size={24} strokeWidth={2} /> Stundenplan
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
        Dein persönlicher Wochenplan über alle Schulen hinweg - jede Schule kann eigene
        Anfangszeiten, Stundenlängen und Pausen haben, einfach pro Eintrag Beginn- und Endzeit
        angeben.
      </p>

      <div className="mt-6">
        <StundenplanEditor eintraege={eintraege} />
      </div>
    </main>
  );
}
