import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const BodySchema = z.object({ tier: z.enum(["starter", "pro"]).nullable() });

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

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Konto nicht gefunden." }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { tier: parsed.data.tier },
  });

  return NextResponse.json({ tier: updated.tier });
}
