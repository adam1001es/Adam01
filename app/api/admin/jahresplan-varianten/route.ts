import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { JahresplanVarianteSpeichernSchema } from "@/lib/jahresplan";

export async function GET() {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }
  const varianten = await prisma.jahresplanVariante.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, varianteId: true, label: true, schuljahr: true, createdAt: true },
  });
  return NextResponse.json({ varianten });
}

/** Zweiter Schritt des Admin-Uploads (siehe app/api/admin/jahresplan-varianten/vorschau/route.ts) -
 * speichert die vom Admin geprüfte (ggf. korrigierte) Wochenliste dauerhaft. Upsert statt reinem
 * Create: falls für dieselbe varianteId (=Schulbeginn-Datum) versehentlich zweimal hochgeladen
 * wird, überschreibt die neuere Version die ältere, statt an einem Unique-Constraint-Fehler zu
 * scheitern. */
export async function POST(request: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = JahresplanVarianteSpeichernSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 },
    );
  }

  const { varianteId, label, schuljahr, wochen } = parsed.data;
  const variante = await prisma.jahresplanVariante.upsert({
    where: { varianteId },
    create: {
      varianteId,
      label,
      schuljahr,
      wochenJson: JSON.stringify(wochen),
      hochgeladenVonId: admin.id,
    },
    update: {
      label,
      schuljahr,
      wochenJson: JSON.stringify(wochen),
      hochgeladenVonId: admin.id,
    },
  });

  return NextResponse.json({ variante }, { status: 201 });
}
