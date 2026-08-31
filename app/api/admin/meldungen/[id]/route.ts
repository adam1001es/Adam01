import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const BodySchema = z.object({ bearbeitet: z.boolean() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
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

  const target = await prisma.meldung.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Meldung nicht gefunden." }, { status: 404 });
  }

  const updated = await prisma.meldung.update({
    where: { id: params.id },
    data: { bearbeitet: parsed.data.bearbeitet },
  });

  return NextResponse.json({ bearbeitet: updated.bearbeitet });
}
