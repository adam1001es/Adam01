import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; zid: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const zuweisung = await prisma.zuweisung.findUnique({
    where: { id: params.zid },
    include: { klasse: true },
  });
  if (!zuweisung || zuweisung.klasseId !== params.id || zuweisung.klasse.userId !== user.id) {
    return NextResponse.json({ error: "Zuweisung nicht gefunden." }, { status: 404 });
  }

  // Cascade löscht die zugehörigen Ergebnisse mit (siehe onDelete: Cascade) - das referenzierte
  // Original-Arbeitsblatt bleibt unberührt.
  await prisma.zuweisung.delete({ where: { id: zuweisung.id } });
  return NextResponse.json({ ok: true });
}
