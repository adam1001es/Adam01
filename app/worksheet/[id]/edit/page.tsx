import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema } from "@/lib/types";
import EditWorksheetForm from "@/components/EditWorksheetForm";
import { getSessionUser } from "@/lib/auth";
import { AUFGABE_ERGAENZEN_PRO_ARBEITSBLATT_MAXIMUM } from "@/lib/aufgabeErgaenzen";

export const dynamic = "force-dynamic";

export default async function EditWorksheetPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!worksheet || worksheet.userId !== user.id) notFound();

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const layout = LayoutConfigSchema.parse(JSON.parse(worksheet.layoutConfig));

  return (
    <main>
      <div className="mb-4">
        <Link
          href={`/worksheet/${worksheet.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
        >
          <ArrowLeft size={15} /> Zurück zur Ansicht (ohne zu speichern)
        </Link>
      </div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        Arbeitsblatt bearbeiten
      </h1>
      <EditWorksheetForm
        worksheetId={worksheet.id}
        initialContent={content}
        initialLayout={layout}
        aufgabeErgaenzenAnzahl={worksheet.aufgabeErgaenzenAnzahl}
        aufgabeErgaenzenMaximum={AUFGABE_ERGAENZEN_PRO_ARBEITSBLATT_MAXIMUM}
      />
    </main>
  );
}
