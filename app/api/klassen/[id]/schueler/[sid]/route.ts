import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function ladeEigenenSchueler(klasseId: string, schuelerId: string, userId: string) {
  const schueler = await prisma.schueler.findUnique({
    where: { id: schuelerId },
    include: { klasse: true },
  });
  if (!schueler || schueler.klasseId !== klasseId || schueler.klasse.userId !== userId) return null;
  return schueler;
}

const UMBENENNEN_SCHEMA = z.object({ label: z.string().min(1).max(100) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; sid: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const schueler = await ladeEigenenSchueler(params.id, params.sid, user.id);
  if (!schueler) return NextResponse.json({ error: "Schüler:in nicht gefunden." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }
  const parsed = UMBENENNEN_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  await prisma.schueler.update({ where: { id: schueler.id }, data: { label: parsed.data.label } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; sid: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const schueler = await ladeEigenenSchueler(params.id, params.sid, user.id);
  if (!schueler) return NextResponse.json({ error: "Schüler:in nicht gefunden." }, { status: 404 });

  await prisma.schueler.delete({ where: { id: schueler.id } });
  return NextResponse.json({ ok: true });
}
