import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { JahresplanErstellenSchema } from "@/lib/jahresplan";
import { holeKalenderVariante } from "@/lib/jahresplanKalender";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const jahresplaene = await prisma.jahresplan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ jahresplaene });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = JahresplanErstellenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 },
    );
  }

  const variante = holeKalenderVariante(parsed.data.variante);
  if (!variante) {
    return NextResponse.json({ error: "Unbekannter Schulbeginn-Termin." }, { status: 400 });
  }

  const jahresplan = await prisma.jahresplan.create({
    data: {
      userId: user.id,
      variante: parsed.data.variante,
      gruppe: parsed.data.gruppe,
      erstelltVon: parsed.data.erstelltVon || null,
      bemerkungenGruppe: parsed.data.bemerkungenGruppe || null,
      speziellerFokus: parsed.data.speziellerFokus || null,
    },
  });
  return NextResponse.json({ jahresplan }, { status: 201 });
}
