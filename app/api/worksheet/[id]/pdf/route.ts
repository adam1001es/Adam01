import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema } from "@/lib/types";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { renderWorksheetPdfBuffer, slugifyTitel } from "@/lib/worksheetExport";

export const runtime = "nodejs";
// Arbeitsblätter mit mehreren live generierten Bildern (Bildergeschichte) können das PDF-Layout
// spürbar verzögern (Bilder aus der DB laden + einbetten + rendern) - Standard-Zeitlimit reicht
// dafür ggf. nicht (siehe derselbe Fix in app/api/generate/route.ts).
export const maxDuration = 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  // Ebenfalls erreichbar, wenn ein anderes zahlendes Konto das Arbeitsblatt für die Community
  // freigegeben hat (siehe app/community) - Herunterladen als eigene Vorlage ist dort der
  // eigentliche Sinn des Teilens.
  if (!worksheet || !(worksheet.userId === user.id || (worksheet.geteilt && istZahlendesKonto(user)))) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const buffer = await renderWorksheetPdfBuffer(worksheet);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slugifyTitel(content.titel)}.pdf"`,
    },
  });
}
