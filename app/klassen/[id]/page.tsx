import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileCheck2, Wand2, Users, LayoutGrid } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { THEMENBEREICHE, ThemenbereichKey } from "@/lib/curriculum";
import { ThemenbereichSchema } from "@/lib/types";
import { prozentZuNote, NOTE_LABEL } from "@/lib/noten";
import { berechneAbdeckung, berechneSchuelerUebersicht, berechneKlassenDurchschnitt } from "@/lib/klassen";
import SchuelerVerwaltung from "@/components/SchuelerVerwaltung";
import EinfacherLoeschButton from "@/components/EinfacherLoeschButton";
import KlasseHeaderBearbeiten from "@/components/KlasseHeaderBearbeiten";

export const dynamic = "force-dynamic";

function prozentAnzeige(prozent: number | null): string {
  if (prozent === null) return "–";
  return `${Math.round(prozent)}% (Note ${prozentZuNote(prozent)} · ${NOTE_LABEL[prozentZuNote(prozent)]})`;
}

export default async function KlassenDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const klasse = await prisma.klasse.findUnique({ where: { id: params.id } });
  if (!klasse || klasse.userId !== user.id) notFound();

  const [schueler, zuweisungen] = await Promise.all([
    prisma.schueler.findMany({ where: { klasseId: klasse.id }, orderBy: { createdAt: "asc" } }),
    prisma.zuweisung.findMany({
      where: { klasseId: klasse.id },
      orderBy: { datum: "desc" },
      include: { ergebnisse: true },
    }),
  ]);

  const alleErgebnisse = zuweisungen.flatMap((z) => z.ergebnisse);
  const abdeckung = berechneAbdeckung(zuweisungen);
  const schuelerUebersicht = berechneSchuelerUebersicht(
    schueler.map((s) => s.id),
    alleErgebnisse,
  );
  const schuelerLabel = new Map(schueler.map((s) => [s.id, s.label]));
  const klassenDurchschnitt = berechneKlassenDurchschnitt(alleErgebnisse);

  return (
    <main>
      <div className="relative overflow-hidden rounded-2xl bg-klassen-gradient px-6 py-8 shadow-card-klassen sm:px-9 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <KlasseHeaderBearbeiten klasseId={klasse.id} name={klasse.name} schulstufe={klasse.schulstufe} />
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/klassen/${klasse.id}/klassenzimmer`}
              className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-card transition hover:bg-surface"
            >
              <LayoutGrid size={16} /> Klassenzimmer-Ansicht
            </Link>
            <Link
              href={`/klassen/${klasse.id}/zuweisen`}
              className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-emerald-700 shadow-card transition hover:bg-emerald-50"
            >
              <Plus size={16} /> Blatt zuweisen
            </Link>
            <Link
              href={`/klassen/${klasse.id}/pruefung-zusammenstellen`}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-white/20"
            >
              <FileCheck2 size={16} /> Prüfung zusammenstellen
            </Link>
            <Link
              href={`/klassen/${klasse.id}/pruefung-generieren`}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-white/20"
            >
              <Wand2 size={16} /> Prüfung generieren
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-emerald-100 bg-surface p-6 shadow-card-klassen">
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-800">Schüler:innen</h2>
        <p className="mb-3 text-xs leading-relaxed text-slate-400">
          Nur mit Kürzel geführt (z.B. "Schüler 1") - keine echten Namen nötig.
        </p>
        <SchuelerVerwaltung klasseId={klasse.id} schueler={schueler} />
      </section>

      <section className="mt-6 rounded-2xl border border-emerald-100 bg-surface p-6 shadow-card-klassen">
        <h2 className="mb-1 font-display text-lg font-semibold text-slate-800">Wissensstand</h2>
        <p className="mb-4 text-xs leading-relaxed text-slate-400">
          Note ist ein Richtwert nach gängigem österreichischem Schlüssel (87/73/59/44%), keine
          offizielle Beurteilung.
        </p>
        <p className="mb-4 text-sm text-slate-600">
          Klassendurchschnitt über alle Ergebnisse:{" "}
          <span className="font-semibold text-slate-800">{prozentAnzeige(klassenDurchschnitt)}</span>
        </p>

        {abdeckung.length === 0 ? (
          <p className="text-sm text-slate-400">
            Noch keine Zuweisung erfasst - „Blatt zuweisen" oben, um zu starten.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-3 font-medium">Grundkompetenz</th>
                  <th className="pb-2 pr-3 font-medium">Zuweisungen</th>
                  <th className="pb-2 pr-3 font-medium">Zuletzt</th>
                  <th className="pb-2 font-medium">Ø Ergebnis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {abdeckung.map((a) => {
                  const key = ThemenbereichSchema.catch("gemischt").parse(a.themenbereich);
                  return (
                    <tr key={a.themenbereich}>
                      <td className="py-2 pr-3 text-slate-700">{THEMENBEREICHE[key as ThemenbereichKey].label}</td>
                      <td className="py-2 pr-3 text-slate-600">{a.anzahlZuweisungen}</td>
                      <td className="py-2 pr-3 text-slate-500">
                        {a.letzteZuweisungAm.toLocaleDateString("de-AT")}
                      </td>
                      <td className="py-2 text-slate-700">{prozentAnzeige(a.durchschnittProzent)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {schueler.length > 0 && (
          <>
            <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Pro Schüler:in</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-3 font-medium">Schüler:in</th>
                    <th className="pb-2 pr-3 font-medium">Ergebnisse</th>
                    <th className="pb-2 font-medium">Ø Ergebnis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schuelerUebersicht.map((s) => (
                    <tr key={s.schuelerId}>
                      <td className="py-2 pr-3 text-slate-700">{schuelerLabel.get(s.schuelerId)}</td>
                      <td className="py-2 pr-3 text-slate-600">{s.anzahlErgebnisse}</td>
                      <td className="py-2 text-slate-700">{prozentAnzeige(s.durchschnittProzent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-emerald-100 bg-surface p-6 shadow-card-klassen">
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-800">Zuweisungen</h2>
        {zuweisungen.length === 0 ? (
          <p className="text-sm text-slate-400">Noch keine Zuweisung erfasst.</p>
        ) : (
          <ul className="space-y-2">
            {zuweisungen.map((z) => {
              const key = ThemenbereichSchema.catch("gemischt").parse(z.themenbereich);
              const anzahlErgebnisse = z.ergebnisse.filter((e) => e.prozent !== null).length;
              return (
                <li
                  key={z.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-surface p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-slate-800">{z.titel}</span>
                      {z.istPruefung && (
                        <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-medium text-gold-700 ring-1 ring-inset ring-gold-200">
                          Prüfung{z.punkteGesamt ? ` · ${z.punkteGesamt} Punkte` : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{THEMENBEREICHE[key as ThemenbereichKey].label}</span>
                      <span>{new Date(z.datum).toLocaleDateString("de-AT")}</span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} /> {anzahlErgebnisse}/{schueler.length} Ergebnisse
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {z.worksheetId && (
                      <Link
                        href={`/worksheet/${z.worksheetId}`}
                        className="shrink-0 text-xs font-medium text-emerald-600 hover:underline"
                      >
                        Blatt ansehen
                      </Link>
                    )}
                    <Link
                      href={`/klassen/${klasse.id}/zuweisung/${z.id}`}
                      className="shrink-0 rounded-lg border border-slate-200 bg-surface px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                    >
                      Ergebnisse
                    </Link>
                    <EinfacherLoeschButton
                      url={`/api/klassen/${klasse.id}/zuweisungen/${z.id}`}
                      bestaetigung={`Zuweisung "${z.titel}" wirklich löschen? Eingetragene Ergebnisse gehen dabei verloren.`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
