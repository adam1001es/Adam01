import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const ERGEBNISSE_SCHEMA = z.object({
  ergebnisse: z.array(
    z.object({
      schuelerId: z.string(),
      prozent: z.number().min(0).max(100).nullable(),
      notiz: z.string().max(500).optional(),
    }),
  ),
});

/** Speichert alle Schüler-Ergebnisse einer Zuweisung in einem Aufruf (statt einer Route pro
 * Schüler:in) - die Eingabemaske zeigt immer die ganze Klasse auf einmal (siehe
 * app/klassen/[id]/zuweisung/[zid]/page.tsx), ein Aufruf pro Zeile wäre unnötig geschwätzig. */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; zid: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const zuweisung = await prisma.zuweisung.findUnique({
    where: { id: params.zid },
    include: { klasse: { include: { schueler: true } } },
  });
  if (!zuweisung || zuweisung.klasseId !== params.id || zuweisung.klasse.userId !== user.id) {
    return NextResponse.json({ error: "Zuweisung nicht gefunden." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }
  const parsed = ERGEBNISSE_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  // Nur Ergebnisse für Schüler:innen speichern, die WIRKLICH zu dieser Klasse gehören - schützt
  // davor, dass über eine fremde schuelerId Ergebnisse in einer anderen (fremden) Klasse landen.
  const gueltigeSchuelerIds = new Set(zuweisung.klasse.schueler.map((s) => s.id));
  const gueltig = parsed.data.ergebnisse.filter((e) => gueltigeSchuelerIds.has(e.schuelerId));

  await Promise.all(
    gueltig.map((e) =>
      prisma.ergebnis.upsert({
        where: { zuweisungId_schuelerId: { zuweisungId: zuweisung.id, schuelerId: e.schuelerId } },
        create: { zuweisungId: zuweisung.id, schuelerId: e.schuelerId, prozent: e.prozent, notiz: e.notiz },
        update: { prozent: e.prozent, notiz: e.notiz },
      }),
    ),
  );

  return NextResponse.json({ ok: true, gespeichert: gueltig.length });
}
