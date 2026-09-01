import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { SCHULSTUFEN_CLUSTER } from "@/lib/curriculum";

const GUELTIGE_IDS = SCHULSTUFEN_CLUSTER.map((c) => c.id);

const BodySchema = z.object({
  unterrichtsStufen: z
    .array(z.string())
    .max(GUELTIGE_IDS.length)
    .refine((ids) => ids.every((id) => GUELTIGE_IDS.includes(id)), "Unbekannte Schulstufe."),
});

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
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
      { error: parsed.error.errors[0]?.message ?? "Ungültige Auswahl." },
      { status: 400 },
    );
  }

  const unterrichtsStufen = Array.from(new Set(parsed.data.unterrichtsStufen));
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { unterrichtsStufen },
  });
  return NextResponse.json({ unterrichtsStufen: updated.unterrichtsStufen });
}
