import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MeldungRequestSchema } from "@/lib/types";

/** Lehrkräfte melden hierüber ein konkretes Problem an einem Arbeitsblatt (fehlende Aufgabe,
 * fehlerhaftes Bild, fehlerhafter Text) - Grundlage für eine manuelle Erstattung/Nachbesserung
 * durch den Admin (siehe app/admin/meldungen). Kein automatischer Erstattungsprozess. */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!worksheet || worksheet.userId !== user.id) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = MeldungRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte eine gültige Kategorie angeben." }, { status: 400 });
  }

  await prisma.meldung.create({
    data: {
      worksheetId: worksheet.id,
      userId: user.id,
      kategorie: parsed.data.kategorie,
      beschreibung: parsed.data.beschreibung || null,
    },
  });

  return NextResponse.json({ ok: true });
}
