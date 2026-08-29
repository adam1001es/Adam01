import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GenerateRequestSchema } from "@/lib/types";
import { generateAndVerifyWorksheet } from "@/lib/generateWorksheet";
import { getSessionUser } from "@/lib/auth";
import { getKontingent } from "@/lib/quota";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

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

  // Kontingent VOR dem teuren Claude-Aufruf prüfen, damit ein blockiertes Konto keine
  // API-Kosten verursacht.
  const kontingent = await getKontingent(user);
  if (kontingent.verbleibend <= 0) {
    const grund = kontingent.tier
      ? `Dein Kontingent für diesen Zyklus (${kontingent.limit} Arbeitsblätter) ist aufgebraucht. Neuer Zyklus ab ${kontingent.zyklusEnde.toLocaleDateString("de-AT")}.`
      : "Dein Konto hat noch kein aktives Abo. Wende dich an die Person, die den Zugang verwaltet.";
    return NextResponse.json({ error: grund }, { status: 403 });
  }

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
        userId: user.id,
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
