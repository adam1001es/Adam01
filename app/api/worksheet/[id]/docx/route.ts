import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema, ThemenbereichSchema } from "@/lib/types";
import { THEMENBEREICHE } from "@/lib/curriculum";
import { buildWorksheetDocx } from "@/lib/docx/buildWorksheetDocx";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { sammleBildGeneriertIds } from "@/lib/generiertesBildHelfer";

export const runtime = "nodejs";
// Siehe dieselbe Begründung in app/api/worksheet/[id]/pdf/route.ts.
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
  // Siehe dieselbe Begründung in app/api/worksheet/[id]/pdf/route.ts.
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
  const generierteBilder = Object.fromEntries(generierteBildRows.map((b) => [b.id, b.data]));

  const buffer = await buildWorksheetDocx(
    content,
    layout,
    THEMENBEREICHE[themenbereich].label,
    worksheet.createdAt,
    generierteBilder,
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
