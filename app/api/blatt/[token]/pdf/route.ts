import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema } from "@/lib/types";
import { renderWorksheetPdfBuffer, slugifyTitel } from "@/lib/worksheetExport";

export const runtime = "nodejs";
// Siehe dieselbe Begründung in app/api/worksheet/[id]/pdf/route.ts.
export const maxDuration = 60;

/** Öffentliches Gegenstück zu app/api/worksheet/[id]/pdf - autorisiert über den Link-Token
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
  // wasserzeichen: true - nur hier, siehe Kommentar auf renderWorksheetPdfBuffer.
  const buffer = await renderWorksheetPdfBuffer(worksheet, true);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slugifyTitel(content.titel)}.pdf"`,
    },
  });
}
