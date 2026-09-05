import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquareWarning } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { FORUM_MELDUNG_ZIEL_TYPEN, ForumMeldungZielTyp } from "@/lib/forum";
import { hatModRechte } from "@/lib/rollen";
import ForumMeldungStatusButton from "@/components/ForumMeldungStatusButton";
import ForumInhaltLoeschenButton from "@/components/ForumInhaltLoeschenButton";
import ForumUserSperrenButton from "@/components/ForumUserSperrenButton";

export const dynamic = "force-dynamic";

const ZIEL_TYP_LABEL: Record<string, string> = {
  thread: "Thema",
  antwort: "Antwort",
  chat: "Chat-Nachricht",
};

/** Übersicht aller Verhaltens-Meldungen im Forum (siehe app/forum) - GRUNDVERSCHIEDEN von
 * app/admin/meldungen (das sind technische Bug-Reports zu Arbeitsblatt-Inhalten). Unbearbeitete
 * zuerst. */
export default async function AdminForumMeldungenPage() {
  const admin = await getSessionUser();
  if (!admin) redirect("/login");
  if (!hatModRechte(admin)) redirect("/");
  const istAdmin = admin.role === "admin";

  const meldungen = await prisma.forumMeldung.findMany({
    orderBy: [{ bearbeitet: "asc" }, { createdAt: "desc" }],
    include: { user: { select: { email: true, username: true } } },
  });

  // gemeldeterUserId ist eine lose Referenz ohne Relation (siehe Kommentar am Modell) - Sperr-
  // Status der gemeldeten Konten separat nachladen, um doppelte Anfragen pro Zeile zu vermeiden.
  const gemeldeteUserIds = Array.from(new Set(meldungen.map((m) => m.gemeldeterUserId)));
  const gemeldeteUser = gemeldeteUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: gemeldeteUserIds } },
        select: { id: true, email: true, username: true, forumGesperrt: true },
      })
    : [];
  const gemeldeteUserById = new Map(gemeldeteUser.map((u) => [u.id, u]));

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
          <MessageSquareWarning size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Forum-Meldungen</h1>
          <p className="text-sm text-slate-500">
            Von Lehrkräften gemeldete Forum-Beiträge wegen unangemessenen Verhaltens.
          </p>
        </div>
      </div>

      {meldungen.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-surface p-6 text-center text-sm text-slate-500">
          Noch keine Forum-Meldungen.
        </p>
      ) : (
        <div className="space-y-3">
          {meldungen.map((m) => {
            const gemeldeterUser = gemeldeteUserById.get(m.gemeldeterUserId);
            const zielTyp = FORUM_MELDUNG_ZIEL_TYPEN.includes(m.zielTyp as ForumMeldungZielTyp)
              ? (m.zielTyp as ForumMeldungZielTyp)
              : "thread";
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
                    <span className="text-xs font-semibold uppercase tracking-wide text-red-700">
                      {ZIEL_TYP_LABEL[m.zielTyp] ?? m.zielTyp}
                    </span>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Gemeldet von <span dir="auto">{m.user.username ?? m.user.email}</span> ·{" "}
                      {m.createdAt.toLocaleDateString("de-AT")}{" "}
                      {m.createdAt.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Autor:in des Beitrags:{" "}
                      <span dir="auto">
                        {gemeldeterUser?.username ?? gemeldeterUser?.email ?? "Konto gelöscht"}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <ForumInhaltLoeschenButton zielTyp={zielTyp} zielId={m.zielId} />
                    {gemeldeterUser && (
                      <ForumUserSperrenButton
                        userId={gemeldeterUser.id}
                        initialGesperrt={gemeldeterUser.forumGesperrt}
                      />
                    )}
                    <ForumMeldungStatusButton meldungId={m.id} initialBearbeitet={m.bearbeitet} />
                  </div>
                </div>
                <p className="mt-2.5 rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-500">Beitrag (zum Meldezeitpunkt): </span>
                  {m.inhaltSnapshot}
                </p>
                {m.grund && (
                  <p className="mt-1.5 rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-500">Begründung der Meldung: </span>
                    {m.grund}
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
