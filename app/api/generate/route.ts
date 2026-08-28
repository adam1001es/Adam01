import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GenerateRequestSchema } from "@/lib/types";
import { generateAndVerifyWorksheet } from "@/lib/generateWorksheet";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const req = parsed.data;

  try {
    const { content, verification } = await generateAndVerifyWorksheet(req);

    const worksheet = await prisma.worksheet.create({
      data: {
        bereich: req.bereich,
        thema: req.thema,
        schulstufe: req.schulstufe,
        themenbereich: req.themenbereich,
        template: req.layout.template,
        layoutConfig: JSON.stringify(req.layout),
        contentJson: JSON.stringify(content),
        verification: JSON.stringify(verification),
        status: verification.status === "fehler" ? "verworfen" : "geprueft",
      },
    });

    return NextResponse.json({ id: worksheet.id });
  } catch (err) {
    console.error("Fehler bei der Arbeitsblatt-Generierung:", err);
    const message =
      err instanceof Error ? err.message : "Unbekannter Fehler bei der Generierung.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
