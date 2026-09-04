import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function ladeEigeneKlasse(id: string, userId: string) {
  const klasse = await prisma.klasse.findUnique({ where: { id } });
  if (!klasse || klasse.userId !== userId) return null;
  return klasse;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const klasse = await ladeEigeneKlasse(params.id, user.id);
  if (!klasse) return NextResponse.json({ error: "Klasse nicht gefunden." }, { status: 404 });

  const [schueler, zuweisungen] = await Promise.all([
    prisma.schueler.findMany({ where: { klasseId: klasse.id }, orderBy: { createdAt: "asc" } }),
    prisma.zuweisung.findMany({
      where: { klasseId: klasse.id },
      orderBy: { datum: "desc" },
      include: { ergebnisse: true },
    }),
  ]);

  return NextResponse.json({ klasse, schueler, zuweisungen });
}

const AENDERUNG_SCHEMA = z.object({
  name: z.string().min(1).max(100).optional(),
  schulstufe: z.string().max(100).nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const klasse = await ladeEigeneKlasse(params.id, user.id);
  if (!klasse) return NextResponse.json({ error: "Klasse nicht gefunden." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }
  const parsed = AENDERUNG_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  await prisma.klasse.update({ where: { id: klasse.id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const klasse = await ladeEigeneKlasse(params.id, user.id);
  if (!klasse) return NextResponse.json({ error: "Klasse nicht gefunden." }, { status: 404 });

  // Cascade löscht Schueler/Zuweisungen/Ergebnisse automatisch (siehe onDelete: Cascade in
  // prisma/schema.prisma) - die referenzierten Original-Arbeitsblätter selbst bleiben unberührt
  // (Zuweisung.worksheetId ist eine lose Referenz ohne FK).
  await prisma.klasse.delete({ where: { id: klasse.id } });
  return NextResponse.json({ ok: true });
}
