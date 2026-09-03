import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import {
  FORUM_CHAT_MAX_LAENGE,
  FORUM_GESPERRT_FEHLERTEXT,
  FORUM_VERBOTENER_INHALT_FEHLERTEXT,
  enthaeltVerbotenesWort,
} from "@/lib/forum";

const CHAT_NUTZER_SELECT = { username: true, avatarEmoji: true, avatarFarbe: true } as const;
const CHAT_POLL_LIMIT = 200;
const CHAT_INITIAL_LIMIT = 50;

/** Chat-Nachrichten seit einem Cursor abrufen (Polling, siehe components/ForumChat.tsx) - ohne
 * "since"-Parameter die letzten CHAT_INITIAL_LIMIT Nachrichten (chronologisch aufsteigend). */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  if (!istZahlendesKonto(user)) {
    return NextResponse.json({ error: "Das Forum ist nur in einem Abo verfügbar." }, { status: 403 });
  }

  const since = request.nextUrl.searchParams.get("since");
  if (since === null) {
    const letzte = await prisma.forumChatNachricht.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: CHAT_INITIAL_LIMIT,
      include: { user: { select: CHAT_NUTZER_SELECT } },
    });
    return NextResponse.json({ nachrichten: letzte.reverse() });
  }

  const seitDatum = new Date(since);
  if (Number.isNaN(seitDatum.getTime())) {
    return NextResponse.json({ error: "Ungültiger since-Parameter." }, { status: 400 });
  }

  const nachrichten = await prisma.forumChatNachricht.findMany({
    where: { createdAt: { gt: seitDatum } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: CHAT_POLL_LIMIT,
    include: { user: { select: CHAT_NUTZER_SELECT } },
  });

  return NextResponse.json({ nachrichten });
}

const BodySchema = z.object({
  inhalt: z.string().trim().min(1).max(FORUM_CHAT_MAX_LAENGE),
});

export async function POST(request: NextRequest) {
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

  if (enthaeltVerbotenesWort(parsed.data.inhalt)) {
    return NextResponse.json({ error: FORUM_VERBOTENER_INHALT_FEHLERTEXT }, { status: 400 });
  }

  const nachricht = await prisma.forumChatNachricht.create({
    data: { userId: user.id, inhalt: parsed.data.inhalt },
    include: { user: { select: CHAT_NUTZER_SELECT } },
  });

  return NextResponse.json({ nachricht });
}
