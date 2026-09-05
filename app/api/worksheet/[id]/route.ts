import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema } from "@/lib/types";
import { getSessionUser } from "@/lib/auth";

// "layout" ist optional, damit ältere Aufrufer (bzw. ein künftiger reiner Inhalts-Patch) weiterhin
// funktionieren - siehe components/EditWorksheetForm.tsx, das inzwischen IMMER beides mitschickt.
const PatchBodySchema = z.object({
  content: WorksheetContentSchema,
  layout: LayoutConfigSchema.optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = PatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültiger Inhalt.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  const { content, layout } = parsed.data;
  await prisma.worksheet.update({
    where: { id: params.id },
    data: {
      contentJson: JSON.stringify(content),
      ...(layout && { layoutConfig: JSON.stringify(layout), template: layout.template }),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const existing = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  await prisma.worksheet.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
