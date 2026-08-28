import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema } from "@/lib/types";
import EditWorksheetForm from "@/components/EditWorksheetForm";

export const dynamic = "force-dynamic";

export default async function EditWorksheetPage({ params }: { params: { id: string } }) {
  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!worksheet) notFound();

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));

  return (
    <main>
      <div className="mb-4">
        <a href={`/worksheet/${worksheet.id}`} className="text-sm text-slate-500 hover:underline">
          ← Zurück zur Ansicht (ohne zu speichern)
        </a>
      </div>
      <h1 className="mb-6 text-2xl font-semibold">Arbeitsblatt bearbeiten</h1>
      <EditWorksheetForm worksheetId={worksheet.id} initialContent={content} />
    </main>
  );
}
