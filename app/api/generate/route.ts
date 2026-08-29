import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GenerateRequestSchema } from "@/lib/types";
import { generateAndVerifyWorksheet } from "@/lib/generateWorksheet";
import { getSessionUser } from "@/lib/auth";
import { getKontingent } from "@/lib/quota";
import { TRIAL_LIMIT, getTrialStatus, incrementTrialUsage } from "@/lib/trial";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();

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

  // Kontingent/Testversion VOR dem teuren Claude-Aufruf prüfen, damit ein blockiertes
  // Konto/Testkontingent keine API-Kosten verursacht.
  if (user) {
    const kontingent = await getKontingent(user);
    if (kontingent.verbleibend <= 0) {
      const grund = kontingent.tier
        ? `Dein Kontingent für diesen Zyklus (${kontingent.limit} Arbeitsblätter) ist aufgebraucht. Neuer Zyklus ab ${kontingent.zyklusEnde.toLocaleDateString("de-AT")}.`
        : "Dein Konto hat noch kein aktives Abo. Wende dich an die Person, die den Zugang verwaltet.";
      return NextResponse.json({ error: grund }, { status: 403 });
    }
  } else if ((await getTrialStatus()).verbleibend <= 0) {
    return NextResponse.json(
      {
        error: `Die kostenlose Testversion (${TRIAL_LIMIT} Arbeitsblätter ohne Konto pro Monat) ist aufgebraucht. Bitte registrieren, um weiterzumachen.`,
      },
      { status: 403 },
    );
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
        userId: user?.id,
      },
    });

    if (!user) await incrementTrialUsage();

    return NextResponse.json({ id: worksheet.id });
  } catch (err) {
    console.error("Fehler bei der Arbeitsblatt-Generierung:", err);
    const message =
      err instanceof Error ? err.message : "Unbekannter Fehler bei der Generierung.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
