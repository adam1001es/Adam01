import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";

const BodySchema = z.object({ geteilt: z.boolean() });

/** Gibt ein eigenes Arbeitsblatt für andere Lehrkräfte frei bzw. zieht die Freigabe zurück
 * (siehe app/community) - bewusst nur für zahlende Konten (istZahlendesKonto), analog zur Idee
 * "nur Starter/Pro teilen untereinander". Sofort sichtbar, kein Freigabe-Workflow. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  if (!istZahlendesKonto(user)) {
    return NextResponse.json(
      { error: "Das Teilen mit anderen Lehrkräften ist nur in einem zahlenden Abo verfügbar." },
      { status: 403 },
    );
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

  const existing = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  const updated = await prisma.worksheet.update({
    where: { id: params.id },
    data: {
      geteilt: parsed.data.geteilt,
      ...(parsed.data.geteilt ? { geteiltAm: new Date() } : {}),
    },
  });

  return NextResponse.json({ geteilt: updated.geteilt });
}
