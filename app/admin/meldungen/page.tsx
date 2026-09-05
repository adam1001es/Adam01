import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flag, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MELDUNG_KATEGORIE_LABEL, MELDUNG_STATUS_LABEL, MeldungKategorie } from "@/lib/types";
import { hatModRechte } from "@/lib/rollen";
import MeldungStatusButton from "@/components/MeldungStatusButton";
import MeldungErstattenButton from "@/components/MeldungErstattenButton";

export const dynamic = "force-dynamic";

const STATUS_BADGE_KLASSE: Record<string, string> = {
  automatisch_behoben: "border-brand-200 bg-brand-50 text-brand-700",
  nicht_behebbar: "border-amber-200 bg-amber-50 text-amber-700",
  kein_fehler_gefunden: "border-slate-200 bg-slate-100 text-slate-600",
  fehler: "border-red-200 bg-red-50 text-red-700",
  offen: "border-slate-200 bg-slate-100 text-slate-600",
};

/** Übersicht aller Lehrkraft-Meldungen zu Arbeitsblättern (fehlende Aufgabe, fehlerhaftes Bild,
 * fehlerhafter Text). Jede Meldung wurde beim Anlegen bereits automatisch von der KI analysiert
 * und - wenn möglich - direkt behoben (siehe lib/meldungFix.ts); hier sieht der Admin das
 * Ergebnis, kann bei Bedarf noch das Kontingent erstatten und unbearbeitete Fälle (bei denen die
 * KI nicht automatisch weiterkam) als gesichtet markieren. Unbearbeitete zuerst. */
export default async function AdminMeldungenPage() {
  const admin = await getSessionUser();
  if (!admin) redirect("/login");
  if (!hatModRechte(admin)) redirect("/");
  // Kontingent-Erstattung bleibt eine finanzielle, admin-exklusive Entscheidung - Moderator:innen
  // dürfen Meldungen einsehen und als bearbeitet markieren, aber nicht erstatten (siehe
  // lib/rollen.ts).
  const istAdmin = admin.role === "admin";

  const meldungen = await prisma.meldung.findMany({
    orderBy: [{ bearbeitet: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { email: true, username: true } },
      worksheet: { select: { id: true, thema: true, contentJson: true, erstattet: true } },
    },
  });

  return (
    <main>
      <Link
        href={istAdmin ? "/admin" : "/admin/moderation"}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft size={15} /> {istAdmin ? "Zurück zur Konten-Verwaltung" : "Zurück zur Moderation"}
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <Flag size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Meldungen</h1>
          <p className="text-sm text-slate-500">
            Von Lehrkräften gemeldete Probleme - jede wird sofort automatisch von der KI geprüft
            und nach Möglichkeit direkt korrigiert.
          </p>
        </div>
      </div>

      {meldungen.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-surface p-6 text-center text-sm text-slate-500">
          Noch keine Meldungen.
        </p>
      ) : (
        <div className="space-y-3">
          {meldungen.map((m) => {
            let titel = m.worksheet?.thema ?? "Arbeitsblatt";
            try {
              titel = JSON.parse(m.worksheet?.contentJson ?? "{}").titel || titel;
            } catch {
              // contentJson defekt - Fallback bleibt bestehen
            }
            return (
              <div
                key={m.id}
                className={`rounded-xl border p-4 shadow-sm ${
                  !m.bearbeitet
                    ? "border-red-200 bg-red-50/40"
                    : "border-slate-200 bg-surface opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-red-700">
                        {MELDUNG_KATEGORIE_LABEL[m.kategorie as MeldungKategorie] ?? m.kategorie}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          STATUS_BADGE_KLASSE[m.status] ?? STATUS_BADGE_KLASSE.offen
                        }`}
                      >
                        {m.status === "automatisch_behoben" && <Sparkles size={11} />}
                        {MELDUNG_STATUS_LABEL[m.status] ?? m.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">
                      {m.worksheet ? (
                        <Link href={`/worksheet/${m.worksheet.id}`} className="hover:underline">
                          {titel}
                        </Link>
                      ) : (
                        titel
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span dir="auto">{m.user.username ?? m.user.email}</span> ·{" "}
                      {m.createdAt.toLocaleDateString("de-AT")}{" "}
                      {m.createdAt.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {istAdmin && m.worksheet && (
                      <MeldungErstattenButton
                        meldungId={m.id}
                        initialErstattet={m.worksheet.erstattet}
                      />
                    )}
                    <MeldungStatusButton meldungId={m.id} initialBearbeitet={m.bearbeitet} />
                  </div>
                </div>
                {m.beschreibung && (
                  <p className="mt-2.5 rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-500">Meldung der Lehrkraft: </span>
                    {m.beschreibung}
                  </p>
                )}
                {m.diagnose && (
                  <p className="mt-1.5 rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-500">KI-Diagnose: </span>
                    {m.diagnose}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
