import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { holeKalenderVarianteAsync } from "@/lib/jahresplanVarianten";
import { renderJahresplanDocxBuffer } from "@/lib/jahresplanDocx";
import { slugifyTitel } from "@/lib/worksheetExport";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const jahresplan = await prisma.jahresplan.findUnique({
    where: { id: params.id },
    include: { wochen: true },
  });
  if (!jahresplan || jahresplan.userId !== user.id) {
    return NextResponse.json({ error: "Jahresplanung nicht gefunden." }, { status: 404 });
  }

  const variante = await holeKalenderVarianteAsync(jahresplan.variante);
  if (!variante) {
    return NextResponse.json({ error: "Unbekannter Schulbeginn-Termin." }, { status: 400 });
  }

  const eintraege = new Map(jahresplan.wochen.map((w) => [w.nummer, w]));
  const buffer = await renderJahresplanDocxBuffer(
    {
      gruppe: jahresplan.gruppe,
      erstelltVon: jahresplan.erstelltVon,
      bemerkungenGruppe: jahresplan.bemerkungenGruppe,
      speziellerFokus: jahresplan.speziellerFokus,
      schuljahr: variante.schuljahr,
    },
    variante.wochen,
    eintraege,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="jahresplanung-${slugifyTitel(jahresplan.gruppe)}.docx"`,
    },
  });
}
