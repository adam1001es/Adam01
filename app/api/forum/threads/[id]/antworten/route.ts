import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { FORUM_INHALT_MAX_LAENGE, FORUM_GESPERRT_FEHLERTEXT } from "@/lib/forum";

const BodySchema = z.object({
  inhalt: z.string().trim().min(1).max(FORUM_INHALT_MAX_LAENGE),
});

/** Antwort auf ein bestehendes Forum-Thema (siehe app/forum/[id]). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  if (!istZahlendesKonto(user)) {
    return NextResponse.json({ error: "Das Forum ist nur in einem Abo verfügbar." }, { status: 403 });
  }
  if (user.forumGesperrt) {
    return NextResponse.json({ error: FORUM_GESPERRT_FEHLERTEXT }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  const thread = await prisma.forumThread.findUnique({ where: { id: params.id } });
  if (!thread) {
    return NextResponse.json({ error: "Thema nicht gefunden." }, { status: 404 });
  }

  const antwort = await prisma.forumAntwort.create({
    data: { threadId: thread.id, userId: user.id, inhalt: parsed.data.inhalt },
  });

  return NextResponse.json({ id: antwort.id });
}
