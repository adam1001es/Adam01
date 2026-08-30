import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, GraduationCap, BookMarked, Sparkles, CheckCircle2, AlertTriangle, XCircle, MailCheck } from "lucide-react";
import FavoritButton from "@/components/FavoritButton";
import DeleteButton from "@/components/DeleteButton";
import IslamicPatternStrip from "@/components/IslamicPatternStrip";
import LandingPage from "@/components/LandingPage";
import { getSessionUser } from "@/lib/auth";
import { getKontingent } from "@/lib/quota";
import KontingentBanner from "@/components/KontingentBanner";

const STATUS_STYLE: Record<string, { text: string; className: string; icon: typeof CheckCircle2 }> = {
  geprueft: { text: "Geprüft", className: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200", icon: CheckCircle2 },
  entwurf: { text: "Entwurf", className: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200", icon: Sparkles },
  verworfen: { text: "Überarbeitung nötig", className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200", icon: XCircle },
  warnung: { text: "Bitte prüfen", className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200", icon: AlertTriangle },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { verifizierung?: string };
}) {
  const user = await getSessionUser();
  if (!user) return <LandingPage />;

  const [worksheets, kontingent] = await Promise.all([
    prisma.worksheet.findMany({
      where: { userId: user.id },
      orderBy: [{ favorit: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    getKontingent(user),
  ]);

  return (
    <main>
      {searchParams.verifizierung === "erfolgreich" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-sm text-brand-800">
          <MailCheck size={16} className="shrink-0" />
          E-Mail-Adresse bestätigt - dein Konto ist jetzt aktiv.
        </div>
      )}
      <div className="mb-6">
        <KontingentBanner kontingent={kontingent} />
      </div>
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient px-6 py-8 shadow-card sm:px-9 sm:py-10">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Deine Arbeitsblätter
          </h1>
          <p className="mt-2 text-sm text-brand-50/90 sm:text-base">
            Bereich, Thema und Schulstufe angeben – der Inhalt wird automatisch erstellt,
            geprüft und lehrplanorientiert aufbereitet.
          </p>
          <Link
            href="/new"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-card transition hover:bg-gold-50"
          >
            <Plus size={17} strokeWidth={2.5} />
            Neues Arbeitsblatt erstellen
          </Link>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <IslamicPatternStrip color="#f4ead1" opacity={0.6} hoehe={22} />
        </div>
      </div>

      {worksheets.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center shadow-card">
          <BookMarked className="mx-auto mb-3 text-brand-300" size={32} strokeWidth={1.5} />
          <p className="text-slate-600">
            Noch keine Arbeitsblätter vorhanden.{" "}
            <Link href="/new" className="font-medium text-brand-600 hover:underline">
              Jetzt das erste erstellen
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <p className="mt-8 text-sm text-slate-500">
            {worksheets.length} {worksheets.length === 1 ? "Arbeitsblatt" : "Arbeitsblätter"}
          </p>
          <ul className="mt-3 space-y-3">
            {worksheets.map((w) => {
              const status = STATUS_STYLE[w.status] ?? STATUS_STYLE.entwurf;
              const StatusIcon = status.icon;
              return (
                <li key={w.id}>
                  <Link
                    href={`/worksheet/${w.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover sm:p-5"
                  >
                    <FavoritButton worksheetId={w.id} initialFavorit={w.favorit} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-base font-semibold text-slate-800 group-hover:text-brand-700">
                        {w.thema}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap size={13} /> {w.schulstufe}
                        </span>
                        <span>{w.bereich}</span>
                        <span>{new Date(w.createdAt).toLocaleString("de-AT")}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                    >
                      <StatusIcon size={13} />
                      {status.text}
                    </span>
                    <DeleteButton worksheetId={w.id} titel={w.thema} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
