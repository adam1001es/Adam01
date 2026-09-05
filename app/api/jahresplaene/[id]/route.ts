import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { JahresplanWochenSpeichernSchema } from "@/lib/jahresplan";

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const jahresplan = await prisma.jahresplan.findUnique({ where: { id: params.id } });
  if (!jahresplan || jahresplan.userId !== user.id) {
    return NextResponse.json({ error: "Jahresplanung nicht gefunden." }, { status: 404 });
  }

  await prisma.jahresplan.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

/** Speichert ALLE übergebenen Wochenzeilen auf einmal (statt einer Route pro Woche) - der Editor
 * schickt bewusst den kompletten, evtl. über mehrere Wochen hinweg geänderten Zustand in einem
 * Aufruf (siehe components/JahresplanEditor.tsx), damit bei ~43 Wochen nicht bei jedem Tastendruck
 * einzeln gespeichert werden muss. Upsert pro Woche (nummer ist innerhalb eines Jahresplans
 * eindeutig, siehe @@unique in prisma/schema.prisma) statt Neuanlegen/Löschen. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const jahresplan = await prisma.jahresplan.findUnique({ where: { id: params.id } });
  if (!jahresplan || jahresplan.userId !== user.id) {
    return NextResponse.json({ error: "Jahresplanung nicht gefunden." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = JahresplanWochenSpeichernSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.wochen.map((w) =>
      prisma.jahresplanWoche.upsert({
        where: { jahresplanId_nummer: { jahresplanId: params.id, nummer: w.nummer } },
        create: {
          jahresplanId: params.id,
          nummer: w.nummer,
          wochenthema: w.wochenthema || null,
          kompetenzen: w.kompetenzen || null,
          notizen: w.notizen || null,
        },
        update: {
          wochenthema: w.wochenthema || null,
          kompetenzen: w.kompetenzen || null,
          notizen: w.notizen || null,
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
