import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { findeElternbriefVorlage, fuelleVorlage } from "@/lib/elternbriefe";
import { renderElternbriefDocxBuffer } from "@/lib/elternbriefeDocx";
import { slugifyTitel } from "@/lib/worksheetExport";

export const runtime = "nodejs";

/** Elternbrief-Vorlage als Word-Dokument (siehe app/werkzeuge/elternbriefe) - für jedes
 * eingeloggte Konto frei verfügbar, kein KI-Aufruf/Kontingent. GET liefert die unausgefüllte
 * Vorlage (Platzhalter in [eckigen Klammern]), POST die im Editor ausgefüllte Fassung (siehe
 * components/ElternbriefEditor.tsx). */
async function docxResponse(titel: string, absaetze: string[]) {
  const buffer = await renderElternbriefDocxBuffer(titel, absaetze);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slugifyTitel(titel)}.docx"`,
    },
  });
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const vorlage = findeElternbriefVorlage(params.id);
  if (!vorlage) {
    return NextResponse.json({ error: "Vorlage nicht gefunden." }, { status: 404 });
  }

  return docxResponse(vorlage.titel, fuelleVorlage(vorlage, {}));
}

const WERTE_SCHEMA = z.record(z.string().max(300));

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const vorlage = findeElternbriefVorlage(params.id);
  if (!vorlage) {
    return NextResponse.json({ error: "Vorlage nicht gefunden." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }
  const parsed = WERTE_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  return docxResponse(vorlage.titel, fuelleVorlage(vorlage, parsed.data));
}
