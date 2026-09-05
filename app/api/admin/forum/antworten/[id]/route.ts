import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hatModRechte } from "@/lib/rollen";

/** Admin/Moderator löscht eine einzelne gemeldete Forum-Antwort. Die zugehörige ForumMeldung
 * bleibt als Nachweis bestehen (lose zielId-Referenz). */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getSessionUser();
  if (!admin || !hatModRechte(admin)) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const target = await prisma.forumAntwort.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Antwort nicht gefunden." }, { status: 404 });
  }

  await prisma.forumAntwort.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
