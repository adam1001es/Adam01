import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { LayoutConfigSchema, WorksheetContent } from "@/lib/types";
import { stelleZusammen, QuellArbeitsblatt } from "@/lib/pruefungZusammenstellen";
import { speichereUsage } from "@/lib/usageLog";
import { starteGenerierung, beendeGenerierung } from "@/lib/auslastung";

// Der Claude-Aufruf hier ist klein (Auswahl statt Neu-Formulierung), aber die Kandidatenliste
// aus mehreren Quell-Arbeitsblättern als Input kann trotzdem etwas dauern - ähnliches Zeitlimit
// wie app/api/generate, deutlich niedriger, da nur EIN statt zwei Claude-Aufrufe.
export const maxDuration = 90;

const REQUEST_SCHEMA = z.object({
  klasseId: z.string(),
  quellWorksheetIds: z.array(z.string()).min(1).max(15),
  punkteGesamt: z.number().int().min(1).max(200),
  themenbereichSchwerpunkt: z.string().max(100).optional(),
  layout: LayoutConfigSchema.optional(),
});

/**
 * Prüfungs-Modus A ("Aus bestehenden Blättern zusammenstellen", siehe lib/pruefungZusammenstellen.ts)
 * - bewusst OHNE Kontingent-Prüfung: der Content wurde bereits einmal generiert und geprüft und
 * bezahlt, dieser Aufruf verbraucht nur wenige zusätzliche Tokens für die Auswahl. Erstellt direkt
 * eine Zuweisung an die angegebene Klasse, da diese Aktion immer aus dem Kontext einer Klasse
 * heraus gestartet wird (siehe app/klassen/[id]/pruefung-zusammenstellen).
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (!istZahlendesKonto(user)) {
    return NextResponse.json(
      { error: "Klassen-Tracking ist nur in einem Abo verfügbar." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }
  const parsed = REQUEST_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const req = parsed.data;

  const klasse = await prisma.klasse.findUnique({ where: { id: req.klasseId } });
  if (!klasse || klasse.userId !== user.id) {
    return NextResponse.json({ error: "Klasse nicht gefunden." }, { status: 404 });
  }

  const worksheets = await prisma.worksheet.findMany({
    where: { id: { in: req.quellWorksheetIds } },
  });
  const zugreifbar = worksheets.filter((w) => w.userId === user.id || w.geteilt);
  if (zugreifbar.length === 0) {
    return NextResponse.json(
      { error: "Keines der ausgewählten Arbeitsblätter ist zugreifbar." },
      { status: 404 },
    );
  }

  let quellen: QuellArbeitsblatt[];
  try {
    quellen = zugreifbar.map((w) => ({
      bezeichnung: w.thema,
      content: JSON.parse(w.contentJson) as WorksheetContent,
    }));
  } catch {
    return NextResponse.json(
      { error: "Eines der Quell-Arbeitsblätter konnte nicht gelesen werden." },
      { status: 500 },
    );
  }

  const auslastungId = await starteGenerierung();
  try {
    const { content, usage } = await stelleZusammen({
      quellen,
      punkteGesamt: req.punkteGesamt,
      themenbereichSchwerpunkt: req.themenbereichSchwerpunkt,
    });

    const layout = req.layout ?? LayoutConfigSchema.parse({});
    const themenbereich = req.themenbereichSchwerpunkt ?? zugreifbar[0].themenbereich;

    const worksheet = await prisma.worksheet.create({
      data: {
        bereich: zugreifbar[0].bereich,
        thema: content.thema,
        schulstufe: zugreifbar[0].schulstufe,
        themenbereich,
        template: layout.template,
        layoutConfig: JSON.stringify(layout),
        contentJson: JSON.stringify(content),
        verification: JSON.stringify({
          status: "ok",
          zusammenfassung:
            "Zusammengestellt aus bereits fachlich geprüften Aufgaben - keine erneute Prüfung nötig.",
          hinweise: [],
        }),
        status: "geprueft",
        userId: user.id,
        istPruefung: true,
        punkteGesamt: req.punkteGesamt,
      },
    });

    await speichereUsage(usage, user.id, worksheet.id);

    const zuweisung = await prisma.zuweisung.create({
      data: {
        klasseId: klasse.id,
        worksheetId: worksheet.id,
        titel: content.titel,
        themenbereich,
        istPruefung: true,
        punkteGesamt: req.punkteGesamt,
        datum: new Date(),
      },
    });

    return NextResponse.json({ worksheetId: worksheet.id, zuweisungId: zuweisung.id });
  } catch (err) {
    console.error("Fehler beim Zusammenstellen der Prüfung:", err);
    const message = err instanceof Error ? err.message : "Unbekannter Fehler.";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    await beendeGenerierung(auslastungId);
  }
}
