import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import PruefungZusammenstellenForm from "@/components/PruefungZusammenstellenForm";

export const dynamic = "force-dynamic";

export default async function PruefungZusammenstellenPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!istZahlendesKonto(user)) redirect("/klassen");

  const klasse = await prisma.klasse.findUnique({ where: { id: params.id } });
  if (!klasse || klasse.userId !== user.id) notFound();

  const [eigene, community] = await Promise.all([
    prisma.worksheet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, thema: true, themenbereich: true },
    }),
    prisma.worksheet.findMany({
      where: { geteilt: true, userId: { not: user.id } },
      orderBy: { geteiltAm: "desc" },
      take: 200,
      select: { id: true, thema: true, themenbereich: true },
    }),
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
      </p>
      <div className="mt-6 rounded-2xl border border-violet-100 bg-surface p-6 shadow-card-klassen">
        <PruefungZusammenstellenForm klasseId={klasse.id} eigene={eigene} community={community} />
      </div>
    </main>
  );
}
