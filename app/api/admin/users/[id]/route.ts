import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// Datumsfelder kommen als "YYYY-MM-DD" (HTML <input type="date">) oder null (Feld geleert).
const DatumFeld = z
  .string()
  .nullable()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Ungültiges Datum.");

const BodySchema = z
  .object({
    tier: z.enum(["starter", "pro"]).nullable(),
    tierGueltigVon: DatumFeld.optional(),
    tierGueltigBis: DatumFeld.optional(),
  })
  .refine(
    (b) => !b.tierGueltigVon || !b.tierGueltigBis || b.tierGueltigVon <= b.tierGueltigBis,
    { message: "„Gültig von“ darf nicht nach „Gültig bis“ liegen." },
  );

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
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Ungültiger Body." },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Konto nicht gefunden." }, { status: 404 });
  }

  const { tier, tierGueltigVon, tierGueltigBis } = parsed.data;
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      tier,
      ...(tierGueltigVon !== undefined && { tierGueltigVon }),
      ...(tierGueltigBis !== undefined && { tierGueltigBis }),
    },
  });

  return NextResponse.json({
    tier: updated.tier,
    tierGueltigVon: updated.tierGueltigVon,
    tierGueltigBis: updated.tierGueltigBis,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  if (params.id === admin.id) {
    return NextResponse.json(
      { error: "Du kannst dein eigenes Admin-Konto nicht löschen." },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Konto nicht gefunden." }, { status: 404 });
  }

  // Arbeitsblätter des Kontos bleiben erhalten (Worksheet.userId wird per Schema auf null
  // gesetzt), nur das Konto und dessen Sessions verschwinden.
  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
