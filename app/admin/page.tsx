import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Flag, BarChart3, Coins, MessageSquareWarning, PenSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getKontingent, istTierAktiv } from "@/lib/quota";
import { istKuerzlichAktiv } from "@/lib/status";
import AdminUserTable, { AdminUserRow } from "@/components/AdminUserTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getSessionUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/");

  // Löscht den Neu-Registrierungen-Punkt am Admin-Icon im Header (siehe SiteHeader.tsx) - diese
  // Seite ("Konten verwalten") ist der Ort, an dem der Admin neue Konten tatsächlich sieht.
  await prisma.user.update({ where: { id: admin.id }, data: { letzteKontenAnsicht: new Date() } });

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  const rows: AdminUserRow[] = await Promise.all(
    users.map(async (u) => {
      const [kontingent, gesamtErstellt] = await Promise.all([
        getKontingent(u),
        prisma.worksheet.count({ where: { userId: u.id } }),
      ]);
      return {
        id: u.id,
        email: u.email,
        username: u.username,
        avatarFarbe: u.avatarFarbe,
        avatarTextFarbe: u.avatarTextFarbe,
        avatarKuerzel: u.avatarKuerzel,
        wirklichOnline: istKuerzlichAktiv(u.letzteAktivitaet),
        role: u.role,
        tier: u.tier,
        tierGueltigVon: u.tierGueltigVon,
        tierGueltigBis: u.tierGueltigBis,
        createdAt: u.createdAt,
        verbraucht: kontingent.verbraucht,
        limit: kontingent.unbegrenzt ? null : kontingent.limit,
        gesamtErstellt,
        istSelbst: u.id === admin.id,
      };
    }),
  );

  // Nur für die Nav-Badge oben rechts (aktive Abos) - die eigentliche Kosten-/Umsatz-Übersicht
  // sitzt in app/admin/kosten/page.tsx, damit diese Seite bei ihrer Überschrift bleibt: reine
  // Konten-Verwaltung, ohne von einem großen Zahlen-Grid verdeckt zu werden.
  const aktiveAbos = rows.filter(
    (r) => r.tier && istTierAktiv(r.tier, r.tierGueltigVon, r.tierGueltigBis),
  ).length;

  const offeneMeldungen = await prisma.meldung.count({ where: { bearbeitet: false } });
  const offeneForumMeldungen = await prisma.forumMeldung.count({ where: { bearbeitet: false } });

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <ShieldCheck size={18} strokeWidth={2} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-800">Konten verwalten</h1>
            <p className="text-sm text-slate-500">
              Kontingent nach privat organisierter Bezahlung zuweisen, Konten suchen und entfernen.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/kosten"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            <Coins size={15} />
            Kosten &amp; Umsatz{aktiveAbos > 0 && ` (${aktiveAbos} aktive Abos)`}
          </Link>
          <Link
            href="/admin/auswertung"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            <BarChart3 size={15} />
            Auswertung
          </Link>
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
          <Link
            href="/admin/inhalte"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            <PenSquare size={15} />
            Inhalte bearbeiten
          </Link>
        </div>
      </div>

      <AdminUserTable rows={rows} />
    </main>
  );
}
