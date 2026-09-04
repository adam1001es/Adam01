import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findeElternbriefVorlage, renderElternbriefDocxBuffer } from "@/lib/elternbriefe";
import { slugifyTitel } from "@/lib/worksheetExport";

export const runtime = "nodejs";

/** Lädt eine Elternbrief-Vorlage als Word-Dokument herunter (siehe app/werkzeuge/elternbriefe) -
 * für jedes eingeloggte Konto frei verfügbar, kein KI-Aufruf/Kontingent. */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const vorlage = findeElternbriefVorlage(params.id);
  if (!vorlage) {
    return NextResponse.json({ error: "Vorlage nicht gefunden." }, { status: 404 });
  }

  const buffer = await renderElternbriefDocxBuffer(vorlage);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slugifyTitel(vorlage.titel)}.docx"`,
    },
  });
}
