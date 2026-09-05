import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/** Löscht eine admin-hochgeladene Kalender-Variante wieder - bereits angelegte Jahresplanungen
 * (siehe Jahresplan.variante), die genau diese Variante referenzieren, verwaisen dadurch
 * NICHT abstürzend: holeKalenderVarianteAsync liefert dann einfach null, die betroffenen Seiten
 * zeigen "Unbekannte Vorlage"/404 statt eines Serverfehlers (siehe app/werkzeuge/jahresplanung/
 * page.tsx und [id]/page.tsx). */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }

  const variante = await prisma.jahresplanVariante.findUnique({ where: { id: params.id } });
  if (!variante) {
    return NextResponse.json({ error: "Variante nicht gefunden." }, { status: 404 });
  }

  await prisma.jahresplanVariante.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
