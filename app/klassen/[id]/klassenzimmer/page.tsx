import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { berechneSchuelerUebersicht, berechneSchuelerVerlauf } from "@/lib/klassen";
import Klassenzimmer from "@/components/Klassenzimmer";

export const dynamic = "force-dynamic";

export default async function KlassenzimmerPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const klasse = await prisma.klasse.findUnique({ where: { id: params.id } });
  if (!klasse || klasse.userId !== user.id) notFound();

  const [schueler, zuweisungen] = await Promise.all([
    prisma.schueler.findMany({ where: { klasseId: klasse.id }, orderBy: { createdAt: "asc" } }),
    prisma.zuweisung.findMany({
      where: { klasseId: klasse.id },
      orderBy: { datum: "asc" },
      include: { ergebnisse: true },
    }),
  ]);

  const uebersicht = berechneSchuelerUebersicht(
    schueler.map((s) => s.id),
    zuweisungen.flatMap((z) => z.ergebnisse),
  );
  const uebersichtNachId = new Map(uebersicht.map((u) => [u.schuelerId, u]));

  const schuelerDaten = schueler.map((s) => ({
    id: s.id,
    label: s.label,
    anzahlErgebnisse: uebersichtNachId.get(s.id)?.anzahlErgebnisse ?? 0,
    durchschnittProzent: uebersichtNachId.get(s.id)?.durchschnittProzent ?? null,
    verlauf: berechneSchuelerVerlauf(s.id, zuweisungen),
  }));

  return (
    <main>
      <Klassenzimmer
        klasseId={klasse.id}
        klasseName={klasse.name}
        klasseSchulstufe={klasse.schulstufe}
        schueler={schuelerDaten}
      />
    </main>
  );
}
