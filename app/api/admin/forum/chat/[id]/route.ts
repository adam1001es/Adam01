import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/** Admin löscht eine einzelne gemeldete Chat-Nachricht. Die zugehörige ForumMeldung bleibt als
 * Nachweis bestehen (lose zielId-Referenz). */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const target = await prisma.forumChatNachricht.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Nachricht nicht gefunden." }, { status: 404 });
  }

  await prisma.forumChatNachricht.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
