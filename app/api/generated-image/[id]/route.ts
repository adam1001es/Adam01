import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Liefert ein live per Bild-KI generiertes, sicherheitsgeprüftes Ausmalbild-Motiv aus (siehe
 * lib/imageGen.ts). Öffentlich wie ein statisches Icon - Arbeitsblatt-Inhalte selbst sind
 * bereits konto-gebunden geschützt, das einzelne Bild dahinter enthält keine sensiblen Daten. */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const bild = await prisma.generatedImage.findUnique({ where: { id: params.id } });
  if (!bild) {
    return NextResponse.json({ error: "Bild nicht gefunden." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bild.data), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
