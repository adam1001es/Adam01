import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const NEUER_SCHUELER_SCHEMA = z.object({ label: z.string().max(100).optional() });

/** Fügt eine/n Schüler:in zur Klasse hinzu - bewusst NUR ein Pseudonym-Feld (siehe
 * Schueler.label in prisma/schema.prisma), kein Name. Ohne eigene Angabe wird automatisch
 * "Schüler N" vergeben (nächste freie Nummer innerhalb der Klasse), damit eine Lehrkraft die
 * Funktion nutzen kann, ohne sich für jeden Eintrag ein Kürzel auszudenken. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const klasse = await prisma.klasse.findUnique({ where: { id: params.id } });
  if (!klasse || klasse.userId !== user.id) {
    return NextResponse.json({ error: "Klasse nicht gefunden." }, { status: 404 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // Body ist optional - leerer/kein Body bedeutet "Default-Label verwenden".
  }
  const parsed = NEUER_SCHUELER_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  let label = parsed.data.label?.trim();
  if (!label) {
    const anzahl = await prisma.schueler.count({ where: { klasseId: klasse.id } });
    label = `Schüler ${anzahl + 1}`;
  }

  const schueler = await prisma.schueler.create({ data: { klasseId: klasse.id, label } });
  return NextResponse.json({ schueler });
}
