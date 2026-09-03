import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { FORUM_MELDUNG_ZIEL_TYPEN, FORUM_MELDUNG_GRUND_MAX_LAENGE } from "@/lib/forum";

const BodySchema = z.object({
  zielTyp: z.enum(FORUM_MELDUNG_ZIEL_TYPEN),
  zielId: z.string().min(1),
  grund: z.string().trim().max(FORUM_MELDUNG_GRUND_MAX_LAENGE).optional(),
});

/** Meldung eines Forum-Beitrags wegen unangemessenen Verhaltens (siehe app/admin/forum-meldungen)
 * - bewusst NICHT durch forumGesperrt blockiert: eine gesperrte Lehrkraft soll weiterhin
 * Beiträge melden können, nur eigenes Posten ist gesperrt. inhaltSnapshot/gemeldeterUserId
 * werden hier zum Meldezeitpunkt eingefroren, siehe Kommentar am ForumMeldung-Modell. */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  if (!istZahlendesKonto(user)) {
    return NextResponse.json({ error: "Das Forum ist nur in einem Abo verfügbar." }, { status: 403 });
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
  const { zielTyp, zielId, grund } = parsed.data;

  let inhalt: string | null = null;
  let gemeldeterUserId: string | null = null;
  if (zielTyp === "thread") {
    const thread = await prisma.forumThread.findUnique({ where: { id: zielId } });
    if (thread) {
      inhalt = thread.inhalt;
      gemeldeterUserId = thread.userId;
    }
  } else if (zielTyp === "antwort") {
    const antwort = await prisma.forumAntwort.findUnique({ where: { id: zielId } });
    if (antwort) {
      inhalt = antwort.inhalt;
      gemeldeterUserId = antwort.userId;
    }
  } else {
    const nachricht = await prisma.forumChatNachricht.findUnique({ where: { id: zielId } });
    if (nachricht) {
      inhalt = nachricht.inhalt;
      gemeldeterUserId = nachricht.userId;
    }
  }

  if (inhalt === null || gemeldeterUserId === null) {
    return NextResponse.json({ error: "Beitrag nicht gefunden." }, { status: 404 });
  }

  const meldung = await prisma.forumMeldung.create({
    data: {
      userId: user.id,
      zielTyp,
      zielId,
      gemeldeterUserId,
      inhaltSnapshot: inhalt,
      grund: grund || null,
    },
  });

  return NextResponse.json({ id: meldung.id });
}
