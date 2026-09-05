import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";

const ZUWEISUNG_SCHEMA = z
  .object({
    // Eigenes/Community-Arbeitsblatt: Titel/Themenbereich/Prüfungs-Felder werden serverseitig
    // AUS dem Arbeitsblatt übernommen (siehe unten), damit ein Client sie nicht fälschen kann.
    worksheetId: z.string().optional(),
    // Manueller Eintrag (außerhalb von Lernwerk Hilal entstandenes Blatt): beide Felder erforderlich.
    titel: z.string().min(1).max(200).optional(),
    themenbereich: z.string().min(1).max(100).optional(),
    datum: z.string().optional(), // ISO-Datum, Default: heute
  })
  .refine((data) => data.worksheetId || (data.titel && data.themenbereich), {
    message: "Entweder worksheetId oder titel+themenbereich erforderlich.",
  });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const klasse = await prisma.klasse.findUnique({ where: { id: params.id } });
  if (!klasse || klasse.userId !== user.id) {
    return NextResponse.json({ error: "Klasse nicht gefunden." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }
  const parsed = ZUWEISUNG_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const req = parsed.data;
  const datum = req.datum ? new Date(req.datum) : new Date();
  if (Number.isNaN(datum.getTime())) {
    return NextResponse.json({ error: "Ungültiges Datum." }, { status: 400 });
  }

  if (req.worksheetId) {
    const worksheet = await prisma.worksheet.findUnique({ where: { id: req.worksheetId } });
    // Zugriff wie überall: eigenes Arbeitsblatt ODER (geteilt + zahlendes Konto) - siehe
    // app/api/worksheet/[id]/pdf für dasselbe Zugriffsmuster. Kostenlose Konten dürfen NUR ihre
    // eigenen Arbeitsblätter zuweisen (siehe app/klassen/[id]/zuweisen/page.tsx).
    if (
      !worksheet ||
      !(worksheet.userId === user.id || (worksheet.geteilt && istZahlendesKonto(user)))
    ) {
      return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
    }
    let titel = worksheet.thema;
    try {
      const content = JSON.parse(worksheet.contentJson) as { titel?: string };
      if (content.titel) titel = content.titel;
    } catch {
      // Fallback auf worksheet.thema bleibt bestehen.
    }
    const zuweisung = await prisma.zuweisung.create({
      data: {
        klasseId: klasse.id,
        worksheetId: worksheet.id,
        titel,
        themenbereich: worksheet.themenbereich,
        istPruefung: worksheet.istPruefung,
        punkteGesamt: worksheet.punkteGesamt,
        datum,
      },
    });
    return NextResponse.json({ id: zuweisung.id });
  }

  const zuweisung = await prisma.zuweisung.create({
    data: {
      klasseId: klasse.id,
      worksheetId: null,
      titel: req.titel!,
      themenbereich: req.themenbereich!,
      datum,
    },
  });
  return NextResponse.json({ id: zuweisung.id });
}
