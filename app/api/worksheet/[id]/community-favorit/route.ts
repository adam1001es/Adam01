import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";

const BodySchema = z.object({ favorit: z.boolean() });

/** Favorisiert/entfavorisiert ein FREMDES, geteiltes Arbeitsblatt in der Community-Übersicht
 * (siehe app/community) - bewusst über ein eigenes CommunityFavorit-Modell statt
 * Worksheet.favorit, da das der private Favoriten-Stern der Besitzerin/des Besitzers ist und
 * hier mehrere fremde Konten unabhängig voneinander favorisieren können müssen. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  if (!istZahlendesKonto(user)) {
    return NextResponse.json({ error: "Nur für zahlende Konten verfügbar." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!worksheet || !worksheet.geteilt) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  if (parsed.data.favorit) {
    await prisma.communityFavorit.upsert({
      where: { userId_worksheetId: { userId: user.id, worksheetId: worksheet.id } },
      create: { userId: user.id, worksheetId: worksheet.id },
      update: {},
    });
  } else {
    await prisma.communityFavorit.deleteMany({
      where: { userId: user.id, worksheetId: worksheet.id },
    });
  }

  return NextResponse.json({ favorit: parsed.data.favorit });
}
