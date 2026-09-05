import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import ZuweisenForm from "@/components/ZuweisenForm";

export const dynamic = "force-dynamic";

export default async function ZuweisenPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const kannFremdeZuweisen = istZahlendesKonto(user);

  const klasse = await prisma.klasse.findUnique({ where: { id: params.id } });
  if (!klasse || klasse.userId !== user.id) notFound();

  const [eigene, community] = await Promise.all([
    prisma.worksheet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, thema: true, themenbereich: true },
    }),
    // Fremde geteilte Arbeitsblätter bleiben Abo-Konten vorbehalten (kostenlose Konten können sie
    // in der Community zwar ansehen, aber nicht öffnen - siehe app/community/page.tsx - daher
    // hier bewusst gar nicht erst zur Auswahl anbieten, statt serverseitig blockiert zu werden).
    kannFremdeZuweisen
      ? prisma.worksheet.findMany({
          where: { geteilt: true, userId: { not: user.id } },
          orderBy: { geteiltAm: "desc" },
          take: 200,
          select: { id: true, thema: true, themenbereich: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-slate-800">
        Blatt zuweisen an „{klasse.name}"
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {kannFremdeZuweisen
          ? "Eigenes/geteiltes Arbeitsblatt auswählen oder ein außerhalb von Lernwerk Hilal entstandenes Blatt manuell erfassen."
          : "Eigenes Arbeitsblatt auswählen oder ein außerhalb von Lernwerk Hilal entstandenes Blatt manuell erfassen. Von anderen geteilte Arbeitsblätter lassen sich nur mit einem Abo zuweisen."}
      </p>
      <div className="mt-6 rounded-2xl border border-emerald-100 bg-surface p-6 shadow-card-klassen">
        <ZuweisenForm klasseId={klasse.id} eigene={eigene} community={community} />
      </div>
    </main>
  );
}
