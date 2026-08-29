import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema, ThemenbereichSchema } from "@/lib/types";
import { THEMENBEREICHE } from "@/lib/curriculum";
import { buildWorksheetDocx } from "@/lib/docx/buildWorksheetDocx";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!worksheet) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  // Arbeitsblätter aus der kostenlosen Testversion (ohne Konto) haben keinen Besitzer und sind
  // öffentlich exportierbar; alles andere bleibt an das erstellende Konto gebunden.
  if (worksheet.userId !== null) {
    const user = await getSessionUser();
    if (!user || worksheet.userId !== user.id) {
      return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
    }
  }

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const layout = LayoutConfigSchema.parse(JSON.parse(worksheet.layoutConfig));
  const themenbereich = ThemenbereichSchema.catch("gemischt").parse(worksheet.themenbereich);

  const buffer = await buildWorksheetDocx(
    content,
    layout,
    THEMENBEREICHE[themenbereich].label,
    worksheet.createdAt,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slugify(content.titel)}.docx"`,
    },
  });
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "arbeitsblatt"
  );
}
