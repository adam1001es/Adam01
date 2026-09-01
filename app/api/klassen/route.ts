import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";

const NEUE_KLASSE_SCHEMA = z.object({
  name: z.string().min(1).max(100),
  schulstufe: z.string().max(100).optional(),
});

/** Klassen-Tracking (siehe app/klassen) ist wie Community-Teilen nur für Abo-Konten gedacht -
 * gleiches Gate wie app/api/worksheet/[id]/teilen. */
function pruefeZugriff(user: Awaited<ReturnType<typeof getSessionUser>>) {
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  if (!istZahlendesKonto(user)) {
    return NextResponse.json(
      { error: "Klassen-Tracking ist nur in einem Abo verfügbar." },
      { status: 403 },
    );
  }
  return null;
}

export async function GET() {
  const user = await getSessionUser();
  const fehler = pruefeZugriff(user);
  if (fehler) return fehler;

  const klassen = await prisma.klasse.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { schueler: true, zuweisungen: true } } },
  });

  return NextResponse.json({ klassen });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  const fehler = pruefeZugriff(user);
  if (fehler) return fehler;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = NEUE_KLASSE_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const klasse = await prisma.klasse.create({
    data: { userId: user!.id, name: parsed.data.name, schulstufe: parsed.data.schulstufe },
  });

  return NextResponse.json({ id: klasse.id });
}
