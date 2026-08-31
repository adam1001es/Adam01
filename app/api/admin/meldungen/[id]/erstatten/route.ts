import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/** Erstattet das Kontingent für das Arbeitsblatt einer gemeldeten Meldung zurück - das
 * Arbeitsblatt bleibt erhalten, zählt aber ab sofort nicht mehr gegen das monatliche
 * Kontingent der Lehrkraft (siehe Worksheet.erstattet, lib/quota.ts). Markiert die Meldung
 * dabei gleich als "bearbeitet", da eine Erstattung eine abgeschlossene Prüfung voraussetzt. */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const meldung = await prisma.meldung.findUnique({ where: { id: params.id } });
  if (!meldung) {
    return NextResponse.json({ error: "Meldung nicht gefunden." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.worksheet.update({ where: { id: meldung.worksheetId }, data: { erstattet: true } }),
    prisma.meldung.update({ where: { id: meldung.id }, data: { status: "bearbeitet" } }),
  ]);

  return NextResponse.json({ ok: true });
}
