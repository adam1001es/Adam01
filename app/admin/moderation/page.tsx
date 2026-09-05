import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Flag, MessageSquareWarning } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hatModRechte } from "@/lib/rollen";

export const dynamic = "force-dynamic";

/** Landing-Seite für Moderator:innen (siehe lib/rollen.ts) - dieselben Meldungen/Forum-Meldungen-
 * Kacheln, die Admins bereits über app/admin/page.tsx erreichen, aber ohne die dortige
 * Kontenverwaltung (Tarif-/Rollenzuweisung, Kosten), auf die Moderator:innen bewusst keinen
 * Zugriff haben. Admins können diese Seite ebenfalls besuchen, landen aber normalerweise über
 * /admin selbst hier. */
export default async function ModerationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!hatModRechte(user)) redirect("/");

  const offeneMeldungen = await prisma.meldung.count({ where: { bearbeitet: false } });
  const offeneForumMeldungen = await prisma.forumMeldung.count({ where: { bearbeitet: false } });

  return (
    <main>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <ShieldCheck size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Moderation</h1>
          <p className="text-sm text-slate-500">
            Arbeitsblatt- und Forum-Meldungen bearbeiten. Wissensbasis-Einträge prüfst du über den
            eigenen Nav-Punkt „Wissensbasis".
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/meldungen"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium shadow-sm transition ${
            offeneMeldungen > 0
              ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-slate-200 bg-surface text-slate-600 hover:border-brand-300 hover:text-brand-700"
          }`}
        >
          <Flag size={15} />
          Meldungen{offeneMeldungen > 0 && ` (${offeneMeldungen} ungesichtet)`}
        </Link>
        <Link
          href="/admin/forum-meldungen"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium shadow-sm transition ${
            offeneForumMeldungen > 0
              ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-slate-200 bg-surface text-slate-600 hover:border-brand-300 hover:text-brand-700"
          }`}
        >
          <MessageSquareWarning size={15} />
          Forum-Meldungen{offeneForumMeldungen > 0 && ` (${offeneForumMeldungen} ungesichtet)`}
        </Link>
      </div>
    </main>
  );
}
