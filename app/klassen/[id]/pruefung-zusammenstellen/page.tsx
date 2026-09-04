import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { holeAuslastung } from "@/lib/auslastung";
import AuslastungHinweis from "@/components/AuslastungHinweis";
import PruefungZusammenstellenForm from "@/components/PruefungZusammenstellenForm";

export const dynamic = "force-dynamic";

export default async function PruefungZusammenstellenPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const kannFremdeZuweisen = istZahlendesKonto(user);

  const klasse = await prisma.klasse.findUnique({ where: { id: params.id } });
  if (!klasse || klasse.userId !== user.id) notFound();

  const [eigene, community, auslastung] = await Promise.all([
    prisma.worksheet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, thema: true, themenbereich: true },
    }),
    // Fremde geteilte Arbeitsblätter bleiben Abo-Konten vorbehalten, siehe
    // app/klassen/[id]/zuweisen/page.tsx für dieselbe Begründung.
    kannFremdeZuweisen
      ? prisma.worksheet.findMany({
          where: { geteilt: true, userId: { not: user.id } },
          orderBy: { geteiltAm: "desc" },
          take: 200,
          select: { id: true, thema: true, themenbereich: true },
        })
      : Promise.resolve([]),
    holeAuslastung(),
  ]);

  return (
    <main className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-slate-800">
        Prüfung zusammenstellen für „{klasse.name}"
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Wähle Arbeitsblätter, aus deren bereits geprüften Aufgaben eine Prüfung zusammengestellt
        wird - kein Neu-Erfinden von Inhalten, dadurch deutlich günstiger als eine komplette
        Neu-Generierung und ohne Kontingent-Verbrauch.
        {!kannFremdeZuweisen && " Von anderen geteilte Arbeitsblätter lassen sich nur mit einem Abo als Quelle verwenden."}
      </p>
      {auslastung.viele && (
        <div className="mt-6">
          <AuslastungHinweis aktiv={auslastung.aktiv} />
        </div>
      )}
      <div className="mt-6 rounded-2xl border border-emerald-100 bg-surface p-6 shadow-card-klassen">
        <PruefungZusammenstellenForm klasseId={klasse.id} eigene={eigene} community={community} />
      </div>
    </main>
  );
}
