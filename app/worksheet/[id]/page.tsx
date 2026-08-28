import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema, ThemenbereichSchema, Verification } from "@/lib/types";
import WorksheetView from "@/components/WorksheetView";

export const dynamic = "force-dynamic";

const VERIFICATION_STYLE: Record<Verification["status"], { label: string; className: string }> = {
  ok: { label: "✅ Geprüft – keine relevanten Probleme gefunden", className: "bg-brand-50 border-brand-200 text-brand-800" },
  warnung: {
    label: "⚠️ Bitte vor Einsatz gegenprüfen",
    className: "bg-amber-50 border-amber-200 text-amber-800",
  },
  fehler: {
    label: "❌ Überarbeitung empfohlen, bevor das Blatt verwendet wird",
    className: "bg-red-50 border-red-200 text-red-800",
  },
};

export default async function WorksheetPage({ params }: { params: { id: string } }) {
  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!worksheet) notFound();

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const layout = LayoutConfigSchema.parse(JSON.parse(worksheet.layoutConfig));
  const verification = JSON.parse(worksheet.verification) as Verification;
  const vStyle = VERIFICATION_STYLE[verification.status];
  const themenbereich = ThemenbereichSchema.catch("gemischt").parse(worksheet.themenbereich);

  return (
    <main>
      <div className="no-print mb-4 flex items-center justify-between">
        <a href="/" className="text-sm text-slate-500 hover:underline">
          ← Zur Übersicht
        </a>
        <div className="flex gap-2">
          <a
            href={`/worksheet/${worksheet.id}/edit`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:border-brand-500"
          >
            ✎ Bearbeiten
          </a>
          <a
            href={`/api/worksheet/${worksheet.id}/pdf`}
            target="_blank"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:border-brand-500"
          >
            PDF öffnen
          </a>
          <a
            href={`/api/worksheet/${worksheet.id}/docx`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:border-brand-500"
          >
            Word (.docx)
          </a>
        </div>
      </div>

      <div className={`no-print mb-6 rounded-lg border p-4 text-sm ${vStyle.className}`}>
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

      <WorksheetView
        content={content}
        layout={layout}
        themenbereich={themenbereich}
        erstelltAm={worksheet.createdAt}
      />
    </main>
  );
}
