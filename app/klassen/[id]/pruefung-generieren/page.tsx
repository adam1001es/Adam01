import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getKontingent, istZahlendesKonto } from "@/lib/quota";
import { getTrialStatus } from "@/lib/trial";
import { THEMENBEREICHE, ThemenbereichKey } from "@/lib/curriculum";
import { ThemenbereichSchema } from "@/lib/types";
import { holeAuslastung } from "@/lib/auslastung";
import AuslastungHinweis from "@/components/AuslastungHinweis";
import NewWorksheetForm from "@/app/new/NewWorksheetForm";

export const dynamic = "force-dynamic";

export default async function PruefungGenerierenPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!istZahlendesKonto(user)) redirect("/klassen");

  const klasse = await prisma.klasse.findUnique({ where: { id: params.id } });
  if (!klasse || klasse.userId !== user.id) notFound();

  const [zuweisungen, kontingent, auslastung] = await Promise.all([
    prisma.zuweisung.findMany({
      where: { klasseId: klasse.id },
      select: { titel: true, themenbereich: true },
    }),
    getKontingent(user),
    holeAuslastung(),
  ]);
  const netzwerkBlockiert =
    !kontingent.unbegrenzt && !kontingent.tier && (await getTrialStatus()).verbleibend <= 0;

  // Fasst zusammen, was diese Klasse laut ihren bisherigen Zuweisungen bereits behandelt hat -
  // als vorausgefüllter (editierbarer) Hinweis an die KI, damit eine frisch generierte Prüfung
  // sich inhaltlich an tatsächlich Unterrichtetem orientiert statt frei zu erfinden, was diese
  // Klasse nie gesehen hat. Für garantierte Übereinstimmung eignet sich stattdessen "Prüfung
  // zusammenstellen" (Modus A) besser - das hier ist eine Annäherung für den Fall, dass wirklich
  // neue Aufgaben gewünscht sind.
  const nachThemenbereich = new Map<string, Set<string>>();
  for (const z of zuweisungen) {
    const menge = nachThemenbereich.get(z.themenbereich) ?? new Set<string>();
    menge.add(z.titel);
    nachThemenbereich.set(z.themenbereich, menge);
  }
  const bereitsBehandeltTeile = Array.from(nachThemenbereich.entries()).map(([themenbereich, titel]) => {
    const key = ThemenbereichSchema.catch("gemischt").parse(themenbereich);
    const label = THEMENBEREICHE[key as ThemenbereichKey].label;
    return `${label}: ${Array.from(titel).map((t) => `„${t}"`).join(", ")}`;
  });
  const initialZusatzhinweise =
    bereitsBehandeltTeile.length > 0
      ? `Bereits in dieser Klasse behandelt (bitte inhaltlich darauf aufbauen, nichts völlig Neues prüfen): ${bereitsBehandeltTeile.join("; ")}.`
      : undefined;

  return (
    <main>
      <Link
        href={`/klassen/${klasse.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
      >
        <ArrowLeft size={15} /> Zurück zu {klasse.name}
      </Link>
      <div className="mb-6 mt-2">
        <h1 className="font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
          Prüfung generieren für „{klasse.name}"
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Neu von der KI erstellt statt aus bestehenden Blättern zusammengestellt - zählt zum
          Kontingent. Orientiert sich am unten vorausgefüllten Hinweis, was diese Klasse bereits
          behandelt hat; für garantierte Übereinstimmung eignet sich stattdessen{" "}
          <Link href={`/klassen/${klasse.id}/pruefung-zusammenstellen`} className="font-medium text-emerald-600 hover:underline">
            „Prüfung zusammenstellen"
          </Link>
          .
        </p>
      </div>
      {auslastung.viele && <AuslastungHinweis aktiv={auslastung.aktiv} />}
      {netzwerkBlockiert && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">Gratis-Kontingent für diesen Browser/dieses Netzwerk aufgebraucht</div>
            <p className="mt-0.5">
              Dein Konto selbst hat noch Kontingent übrig, aber von diesem Browser/Netzwerk aus
              wurde das einmalige kostenlose Kontingent bereits vollständig genutzt (unabhängig
              vom Konto). Für mehr: ein Abo bei der Person anfragen, die den Zugang verwaltet.
            </p>
          </div>
        </div>
      )}
      <NewWorksheetForm
        kannErstellen={kontingent.verbleibend > 0 && !netzwerkBlockiert}
        klasseId={klasse.id}
        klasseName={klasse.name}
        initialSchulstufe={klasse.schulstufe ?? undefined}
        initialZusatzhinweise={initialZusatzhinweise}
      />
    </main>
  );
}
