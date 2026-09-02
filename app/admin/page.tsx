import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Flag, BarChart3, BookMarked, Coins } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getKontingent, istTierAktiv } from "@/lib/quota";
import AdminUserTable, { AdminUserRow } from "@/components/AdminUserTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getSessionUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/");

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
  const offeneWissensEntwuerfe = await prisma.wissensEintrag.count({ where: { status: "entwurf" } });

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
            href="/admin/wissensbasis"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium shadow-sm transition ${
              offeneWissensEntwuerfe > 0
                ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-slate-200 bg-surface text-slate-600 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            <BookMarked size={15} />
            Wissensbasis{offeneWissensEntwuerfe > 0 && ` (${offeneWissensEntwuerfe} Entwürfe)`}
          </Link>
        </div>
      </div>

      <AdminUserTable rows={rows} />
    </main>
  );
}
