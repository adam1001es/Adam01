import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hatModRechte } from "@/lib/rollen";
import {
  setzeStatus,
  aktualisiereInhalt,
  loescheWissensEintrag,
  ZitatInhaltSchema,
  MusteraufgabeInhaltSchema,
  BegriffInhaltSchema,
} from "@/lib/wissensbasis";

const BodySchema = z
  .object({
    status: z.enum(["geprueft", "abgelehnt"]).optional(),
    inhalt: z.record(z.unknown()).optional(),
    rechercheNotiz: z.string().optional(),
  })
  .refine((b) => b.status !== undefined || b.inhalt !== undefined || b.rechercheNotiz !== undefined, {
    message: "Mindestens ein Feld (status/inhalt/rechercheNotiz) muss gesetzt sein.",
  });

/** Freigeben/Ablehnen (status) und/oder Bearbeiten (inhalt/rechercheNotiz) eines Wissensbasis-
 * Eintrags - das ist die einzige Stelle im Code, an der ein Eintrag auf "geprueft" wechseln kann,
 * und das passiert ausschließlich über diese admin-only Route, nie automatisiert. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getSessionUser();
  if (!admin || !hatModRechte(admin)) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const target = await prisma.wissensEintrag.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
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

  if (parsed.data.inhalt !== undefined) {
    const inhaltSchema =
      target.typ === "zitat"
        ? ZitatInhaltSchema
        : target.typ === "begriff"
          ? BegriffInhaltSchema
          : MusteraufgabeInhaltSchema;
    const inhaltParsed = inhaltSchema.safeParse(parsed.data.inhalt);
    if (!inhaltParsed.success) {
      return NextResponse.json(
        { error: `Ungültiger Inhalt: ${inhaltParsed.error.errors[0]?.message}` },
        { status: 400 },
      );
    }
    await aktualisiereInhalt(target.id, inhaltParsed.data, parsed.data.rechercheNotiz);
  } else if (parsed.data.rechercheNotiz !== undefined) {
    await prisma.wissensEintrag.update({
      where: { id: target.id },
      data: { rechercheNotiz: parsed.data.rechercheNotiz },
    });
  }

  if (parsed.data.status) {
    await setzeStatus(target.id, parsed.data.status);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getSessionUser();
  if (!admin || !hatModRechte(admin)) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const target = await prisma.wissensEintrag.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  await loescheWissensEintrag(target.id);
  return NextResponse.json({ ok: true });
}
