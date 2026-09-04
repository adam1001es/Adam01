import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/** Eigenes Forum-Thema löschen (kaskadiert dessen Antworten, siehe ForumThread.antworten
 * onDelete: Cascade) - nur die Autorin/der Autor selbst. Getrennt von
 * app/api/admin/forum/threads/[id] (Admin-Moderation gemeldeter Inhalte, prüft role "admin"
 * statt Eigentümerschaft). */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  }

  const target = await prisma.forumThread.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Thema nicht gefunden." }, { status: 404 });
  }
  if (target.userId !== user.id) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  await prisma.forumThread.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
