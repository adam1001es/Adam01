import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema, ThemenbereichSchema } from "@/lib/types";
import { THEMENBEREICHE } from "@/lib/curriculum";
import { WorksheetPdfDocument } from "@/lib/pdf/WorksheetPdf";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { sammleBildGeneriertIds } from "@/lib/generiertesBildHelfer";

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
  const layout = LayoutConfigSchema.parse(JSON.parse(worksheet.layoutConfig));
  const themenbereich = ThemenbereichSchema.catch("gemischt").parse(worksheet.themenbereich);

  const bildIds = sammleBildGeneriertIds(content);
  const generierteBildRows = bildIds.length
    ? await prisma.generatedImage.findMany({ where: { id: { in: bildIds } } })
    : [];
  const generierteBilder = Object.fromEntries(
    generierteBildRows.map((b) => [b.id, `data:image/png;base64,${b.data.toString("base64")}`]),
  );

  const element = React.createElement(WorksheetPdfDocument, {
    content,
    layout,
    themenbereichLabel: THEMENBEREICHE[themenbereich].label,
    erstelltAm: worksheet.createdAt,
    generierteBilder,
  });
  const buffer = await renderToBuffer(
    element as unknown as Parameters<typeof renderToBuffer>[0],
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slugify(content.titel)}.pdf"`,
    },
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "arbeitsblatt";
}
