import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = WorksheetContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültiger Inhalt.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  await prisma.worksheet.update({
    where: { id: params.id },
    data: { contentJson: JSON.stringify(parsed.data) },
  });

  return NextResponse.json({ ok: true });
}
