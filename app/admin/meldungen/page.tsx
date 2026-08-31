import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MELDUNG_KATEGORIE_LABEL, MeldungKategorie } from "@/lib/types";
import MeldungStatusButton from "@/components/MeldungStatusButton";
import MeldungErstattenButton from "@/components/MeldungErstattenButton";

export const dynamic = "force-dynamic";

/** Übersicht aller Lehrkraft-Meldungen zu Arbeitsblättern (fehlende Aufgabe, fehlerhaftes Bild,
 * fehlerhafter Text) - Grundlage für eine manuelle Erstattung/Nachbesserung. Offene Meldungen
 * zuerst, damit sie nicht in einer langen Liste untergehen. */
export default async function AdminMeldungenPage() {
  const admin = await getSessionUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/");

  const meldungen = await prisma.meldung.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { email: true, username: true } },
      worksheet: { select: { id: true, thema: true, contentJson: true, erstattet: true } },
    },
  });

  return (
    <main>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft size={15} /> Zurück zur Konten-Verwaltung
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <Flag size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Meldungen</h1>
          <p className="text-sm text-slate-500">
            Von Lehrkräften gemeldete Probleme an Arbeitsblättern - Grundlage für eine manuelle
            Erstattung.
          </p>
        </div>
      </div>

      {meldungen.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
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
                  m.status === "offen"
                    ? "border-red-200 bg-red-50/40"
                    : "border-slate-200 bg-white opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-red-700">
                      {MELDUNG_KATEGORIE_LABEL[m.kategorie as MeldungKategorie] ?? m.kategorie}
                    </span>
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
                      {m.user.username ?? m.user.email} · {m.createdAt.toLocaleDateString("de-AT")}{" "}
                      {m.createdAt.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {m.worksheet && (
                      <MeldungErstattenButton
                        meldungId={m.id}
                        initialErstattet={m.worksheet.erstattet}
                      />
                    )}
                    <MeldungStatusButton meldungId={m.id} initialStatus={m.status} />
                  </div>
                </div>
                {m.beschreibung && (
                  <p className="mt-2.5 rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-600">
                    {m.beschreibung}
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
