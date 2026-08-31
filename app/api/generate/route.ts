import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GenerateRequestSchema } from "@/lib/types";
import { generateAndVerifyWorksheet } from "@/lib/generateWorksheet";
import { getSessionUser } from "@/lib/auth";
import { getKontingent } from "@/lib/quota";
import { getTrialStatus, incrementTrialUsage } from "@/lib/trial";

// Generierung + Verifikation + ggf. mehrere Bild-Generierungen können zusammen deutlich länger
// als das Standard-Zeitlimit dauern - ohne diese Erhöhung bricht Vercel die Funktion vorzeitig
// ab und der Browser zeigt statt der Arbeitsblatt-Seite nur einen generischen Fehler. 180s als
// großzügiger Puffer - mit Fluid Compute (seit 2026 Standard, auch auf dem kostenlosen
// Hobby-Plan) sind bis zu 300s möglich, ohne dass ein Deploy fehlschlägt.
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Bitte anmelden, um ein Arbeitsblatt zu erstellen." },
      { status: 401 },
    );
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
      : `Dein kostenloses Kontingent (${kontingent.limit} Arbeitsblätter/Monat) ist für diesen Zyklus aufgebraucht. Für mehr: ein Abo bei der Person anfragen, die den Zugang verwaltet.`;
    return NextResponse.json({ error: grund }, { status: 403 });
  }

  // Separates, engeres Kontingent für bildbasierte Arbeitsblätter (siehe TIER_BILD_QUOTA) - eine
  // Live-Bildgenerierung kostet deutlich mehr als ein reines Textblatt, daher eigene Grenze
  // unabhängig vom allgemeinen Kontingent oben.
  const istBildAnfrage = req.aufgabentypen.some(
    (t) => t === "ausmalbild" || t === "bildergeschichte",
  );
  if (istBildAnfrage && !kontingent.unbegrenzt && kontingent.bildVerbleibend <= 0) {
    return NextResponse.json(
      {
        error: `Dein Kontingent für bildbasierte Arbeitsblätter (Ausmalbild/Bildergeschichte) ist für diesen Zyklus aufgebraucht (${kontingent.bildLimit}/Monat). Andere Aufgabentypen kannst du weiterhin nutzen. Neuer Zyklus ab ${kontingent.zyklusEnde.toLocaleDateString("de-AT")}.`,
      },
      { status: 403 },
    );
  }

  // Nur Konten OHNE bezahltes Abo unterliegen zusätzlich der Browser-/IP-Sperre - sie
  // verhindert, dass sich jemand mehrere Konten anlegt, um das Gratis-Kontingent zu
  // vervielfachen. Bezahlte Abos wurden von einem Admin manuell freigeschaltet und Admin-Konten
  // selbst (unbegrenztes Kontingent) sind davon ausgenommen.
  if (!kontingent.unbegrenzt && !kontingent.tier && (await getTrialStatus()).verbleibend <= 0) {
    return NextResponse.json(
      {
        error:
          "Das kostenlose Kontingent für diesen Browser/dieses Netzwerk ist für diesen Monat aufgebraucht (unabhängig vom Konto). Für mehr: ein Abo anfragen.",
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
        userId: user.id,
      },
    });

    if (!kontingent.unbegrenzt && !kontingent.tier) await incrementTrialUsage();

    return NextResponse.json({ id: worksheet.id });
  } catch (err) {
    console.error("Fehler bei der Arbeitsblatt-Generierung:", err);
    const message =
      err instanceof Error ? err.message : "Unbekannter Fehler bei der Generierung.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
