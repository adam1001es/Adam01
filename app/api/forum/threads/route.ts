import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import {
  FORUM_KATEGORIEN,
  FORUM_TITEL_MAX_LAENGE,
  FORUM_INHALT_MAX_LAENGE,
  FORUM_GESPERRT_FEHLERTEXT,
  FORUM_VERBOTENER_INHALT_FEHLERTEXT,
  enthaeltVerbotenesWort,
} from "@/lib/forum";

const BodySchema = z.object({
  titel: z.string().trim().min(1).max(FORUM_TITEL_MAX_LAENGE),
  inhalt: z.string().trim().min(1).max(FORUM_INHALT_MAX_LAENGE),
  kategorie: z.enum(FORUM_KATEGORIEN),
});

/** Neues Thema im Lehrkräfte-Forum (siehe app/forum) - gleiches Abo-Gate wie Community/Klassen,
 * zusätzlich per forumGesperrt sperrbar (siehe app/admin/forum-meldungen). */
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
    return NextResponse.json(
      { error: "Ungültige Eingabe.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (
    enthaeltVerbotenesWort(parsed.data.titel) ||
    enthaeltVerbotenesWort(parsed.data.inhalt)
  ) {
    return NextResponse.json({ error: FORUM_VERBOTENER_INHALT_FEHLERTEXT }, { status: 400 });
  }

  const thread = await prisma.forumThread.create({
    data: {
      userId: user.id,
      titel: parsed.data.titel,
      inhalt: parsed.data.inhalt,
      kategorie: parsed.data.kategorie,
    },
  });

  return NextResponse.json({ id: thread.id });
}
