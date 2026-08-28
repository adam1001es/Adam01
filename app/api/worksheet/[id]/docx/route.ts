import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema } from "@/lib/types";
import { buildWorksheetDocx } from "@/lib/docx/buildWorksheetDocx";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!worksheet) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const layout = LayoutConfigSchema.parse(JSON.parse(worksheet.layoutConfig));

  const buffer = await buildWorksheetDocx(content, layout);

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
