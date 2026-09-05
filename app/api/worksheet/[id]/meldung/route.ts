import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MeldungRequestSchema, WorksheetContentSchema } from "@/lib/types";
import { analysiereUndBehebeMeldung } from "@/lib/meldungFix";
import { speichereUsage } from "@/lib/usageLog";

// Die Analyse (Opus-Aufruf, ggf. inkl. neuer Bildgenerierung) läuft synchron in dieser Route,
// analog zu /api/generate - kann bei einem Bild-Fix mehrere zehn Sekunden dauern.
export const maxDuration = 120;

/** Lehrkräfte melden hierüber ein konkretes Problem an einem Arbeitsblatt (fehlende Aufgabe,
 * fehlerhaftes Bild, fehlerhafter Text). Die Meldung wird SOFORT automatisch analysiert und bei
 * Erfolg direkt behoben (siehe lib/meldungFix.ts) - kein manueller Zwischenschritt. Das Ergebnis
 * landet zusätzlich unter /admin/meldungen, u.a. damit ein Admin bei Bedarf noch das Kontingent
 * erstattet. */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!worksheet || worksheet.userId !== user.id) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = MeldungRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte eine gültige Kategorie angeben." }, { status: 400 });
  }

  const meldung = await prisma.meldung.create({
    data: {
      worksheetId: worksheet.id,
      userId: user.id,
      kategorie: parsed.data.kategorie,
      beschreibung: parsed.data.beschreibung || null,
    },
  });

  const inhaltParsed = WorksheetContentSchema.safeParse(JSON.parse(worksheet.contentJson));
  if (!inhaltParsed.success) {
    await prisma.meldung.update({
      where: { id: meldung.id },
      data: { status: "fehler", diagnose: "Arbeitsblatt-Inhalt konnte nicht gelesen werden." },
    });
    return NextResponse.json({
      ok: true,
      status: "fehler",
      diagnose: "Arbeitsblatt-Inhalt konnte nicht gelesen werden. Bitte manuell prüfen.",
    });
  }

  const ergebnis = await analysiereUndBehebeMeldung(
    inhaltParsed.data,
    parsed.data.kategorie,
    parsed.data.beschreibung || null,
  );
  await speichereUsage(ergebnis.usage, user.id, worksheet.id);

  if (ergebnis.status === "automatisch_behoben" && ergebnis.neuerInhalt) {
    await prisma.worksheet.update({
      where: { id: worksheet.id },
      data: { contentJson: JSON.stringify(ergebnis.neuerInhalt) },
    });
  }

  await prisma.meldung.update({
    where: { id: meldung.id },
    data: { status: ergebnis.status, diagnose: ergebnis.diagnose },
  });

  return NextResponse.json({ ok: true, status: ergebnis.status, diagnose: ergebnis.diagnose });
}
