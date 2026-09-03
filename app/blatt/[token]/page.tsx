import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, FileType2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema, ThemenbereichSchema, Verification } from "@/lib/types";
import WorksheetView from "@/components/WorksheetView";
import VerificationBanner from "@/components/VerificationBanner";

export const dynamic = "force-dynamic";

/** Öffentliche, NICHT angemeldete Ansicht eines Arbeitsblatts über einen Link-Token (siehe
 * Worksheet.oeffentlicherLinkToken, app/api/worksheet/[id]/link, components/LinkTeilenButton.tsx)
 * - Gegenstück zu app/worksheet/[id]/page.tsx, aber bewusst ohne getSessionUser()-Gate und ohne
 * Besitzer-Aktionen (Bearbeiten/Löschen/Community-Teilen): wer den Link hat, sieht nur das
 * Arbeitsblatt selbst plus PDF-/Word-Export. Ein widerrufener oder nie aktivierter Token führt zu
 * notFound(), da findUnique dann keine Zeile trifft (kein separates "aktiv"-Flag nötig - siehe
 * Schema-Kommentar). */
export default async function OeffentlichesBlattPage({ params }: { params: { token: string } }) {
  const worksheet = await prisma.worksheet.findUnique({
    where: { oeffentlicherLinkToken: params.token },
  });
  if (!worksheet) notFound();

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const layout = LayoutConfigSchema.parse(JSON.parse(worksheet.layoutConfig));
  const verification = JSON.parse(worksheet.verification) as Verification;
  const themenbereich = ThemenbereichSchema.catch("gemischt").parse(worksheet.themenbereich);

  return (
    <main>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Über einen geteilten Link geöffnet -{" "}
          <Link href="/" className="font-medium text-brand-600 hover:underline">
            mehr über Lernwerk
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/blatt/${params.token}/pdf`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3.5 py-2 text-sm font-medium text-white shadow-card transition hover:shadow-card-hover"
          >
            <FileText size={15} /> PDF öffnen
          </a>
          <a
            href={`/api/blatt/${params.token}/docx`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            <FileType2 size={15} /> Word (.docx)
          </a>
        </div>
      </div>

      <VerificationBanner verification={verification} />

      <WorksheetView
        content={content}
        layout={layout}
        themenbereich={themenbereich}
        erstelltAm={worksheet.createdAt}
      />
    </main>
  );
}
