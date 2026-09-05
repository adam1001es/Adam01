import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema } from "@/lib/types";
import { renderWorksheetDocxBuffer, slugifyTitel } from "@/lib/worksheetExport";
import { holeSiteInhalte } from "@/lib/siteContent";

export const runtime = "nodejs";
// Siehe dieselbe Begründung in app/api/worksheet/[id]/pdf/route.ts.
export const maxDuration = 60;

/** Öffentliches Gegenstück zu app/api/worksheet/[id]/docx - autorisiert über den Link-Token
 * (Worksheet.oeffentlicherLinkToken) statt über eine Session, siehe app/blatt/[token]. */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  const worksheet = await prisma.worksheet.findUnique({
    where: { oeffentlicherLinkToken: params.token },
  });
  if (!worksheet) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  // Wasserzeichen-Text nur hier gesetzt, siehe Kommentar auf renderWorksheetDocxBuffer -
  // admin-editierbar über app/admin/inhalte ("design.wasserzeichen.text").
  const inhalte = await holeSiteInhalte();
  const buffer = await renderWorksheetDocxBuffer(worksheet, inhalte["design.wasserzeichen.text"]);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slugifyTitel(content.titel)}.docx"`,
    },
  });
}
