import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { findeElternbriefVorlage, fuelleVorlage, textZuAbsaetze } from "@/lib/elternbriefe";
import { renderElternbriefDocxBuffer } from "@/lib/elternbriefeDocx";
import { slugifyTitel } from "@/lib/worksheetExport";

export const runtime = "nodejs";

/** Elternbrief-Vorlage als Word-Dokument (siehe app/werkzeuge/elternbriefe) - für jedes
 * eingeloggte Konto frei verfügbar, kein KI-Aufruf/Kontingent. GET liefert einen unausgefüllten
 * Standardentwurf (Platzhalter in [eckigen Klammern]), POST den von der Lehrkraft im Editor frei
 * umformulierten Text (siehe components/ElternbriefEditor.tsx) - der Editor schickt nicht mehr
 * einzelne Feldwerte, sondern den fertigen Brieftext, damit die Wortwahl nicht auf die
 * Vorlagen-Platzhalter beschränkt bleibt. */
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

  return docxResponse(vorlage.titel, fuelleVorlage(vorlage, {}, true));
}

const TEXT_SCHEMA = z.object({ text: z.string().trim().min(1).max(20_000) });

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
  const parsed = TEXT_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  return docxResponse(vorlage.titel, textZuAbsaetze(parsed.data.text));
}
