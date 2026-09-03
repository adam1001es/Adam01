import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/** Admin löscht ein gemeldetes Forum-Thema (kaskadiert dessen Antworten, siehe
 * ForumThread.antworten onDelete: Cascade). Die zugehörige(n) ForumMeldung(en) bleiben als
 * Nachweis bestehen (lose zielId-Referenz, siehe Kommentar am ForumMeldung-Modell). */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const target = await prisma.forumThread.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Thema nicht gefunden." }, { status: 404 });
  }

  await prisma.forumThread.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
