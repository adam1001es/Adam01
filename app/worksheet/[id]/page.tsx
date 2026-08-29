import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, FileText, FileType2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema, ThemenbereichSchema, Verification } from "@/lib/types";
import WorksheetView from "@/components/WorksheetView";
import FavoritButton from "@/components/FavoritButton";
import DeleteButton from "@/components/DeleteButton";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VERIFICATION_STYLE: Record<
  Verification["status"],
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  ok: {
    label: "Geprüft – keine relevanten Probleme gefunden",
    className: "bg-brand-50 border-brand-200 text-brand-800",
    icon: CheckCircle2,
  },
  warnung: {
    label: "Bitte vor Einsatz gegenprüfen",
    className: "bg-amber-50 border-amber-200 text-amber-800",
    icon: AlertTriangle,
  },
  fehler: {
    label: "Überarbeitung empfohlen, bevor das Blatt verwendet wird",
    className: "bg-red-50 border-red-200 text-red-800",
    icon: XCircle,
  },
};

export default async function WorksheetPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!worksheet || worksheet.userId !== user.id) notFound();

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const layout = LayoutConfigSchema.parse(JSON.parse(worksheet.layoutConfig));
  const verification = JSON.parse(worksheet.verification) as Verification;
  const vStyle = VERIFICATION_STYLE[verification.status];
  const VIcon = vStyle.icon;
  const themenbereich = ThemenbereichSchema.catch("gemischt").parse(worksheet.themenbereich);

  return (
    <main>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
        >
          <ArrowLeft size={15} /> Zur Übersicht
        </Link>
        <div className="flex items-center gap-2">
          <FavoritButton worksheetId={worksheet.id} initialFavorit={worksheet.favorit} />
          <Link
            href={`/worksheet/${worksheet.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            <Pencil size={15} /> Bearbeiten
          </Link>
          <a
            href={`/api/worksheet/${worksheet.id}/pdf`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3.5 py-2 text-sm font-medium text-white shadow-card transition hover:shadow-card-hover"
          >
            <FileText size={15} /> PDF öffnen
          </a>
          <a
            href={`/api/worksheet/${worksheet.id}/docx`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            <FileType2 size={15} /> Word (.docx)
          </a>
          <DeleteButton worksheetId={worksheet.id} titel={content.titel} redirectTo="/" variant="button" />
        </div>
      </div>

      <div className={`no-print mb-6 flex gap-3 rounded-xl border p-4 text-sm shadow-sm ${vStyle.className}`}>
        <VIcon size={19} className="mt-0.5 shrink-0" />
        <div>
          <div className="font-medium">{vStyle.label}</div>
          <p className="mt-1">{verification.zusammenfassung}</p>
          {verification.hinweise.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5">
              {verification.hinweise.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <WorksheetView
        content={content}
        layout={layout}
        themenbereich={themenbereich}
        erstelltAm={worksheet.createdAt}
      />
    </main>
  );
}
