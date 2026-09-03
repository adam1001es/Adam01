import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { holeVersBereich, formatiereKoranZitat } from "@/lib/quranApi";

/** Liefert den live von der Koran-API abgerufenen Wortlaut (deutsche Übersetzung) eines
 * Sure-/Versbereichs - für "Aufgabe hinzufügen" auf der Bearbeiten-Seite (siehe
 * EditWorksheetForm.tsx), wenn die Lehrkraft einen Vers direkt als Lesetext-Aufgabe übernehmen
 * möchte, statt ihn per KI generieren zu lassen. Kein Claude-Aufruf, kein Kontingent-Verbrauch.
 * Liefert bewusst NUR die deutsche Übersetzung (nicht den arabischen Urtext wie bei
 * WorksheetContent.koranVerse) - "lesetext" (siehe AufgabeSchema) wird ohne die für arabischen
 * Fließtext registrierte Amiri-Schrift gerendert (siehe lib/pdf/WorksheetPdf.tsx), arabischer
 * Text darin würde im PDF genau das Zeichen-Darstellungsproblem reproduzieren, das für den
 * dedizierten koranVerse-Block bereits einmal behoben wurde. */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sureNummer = Number(searchParams.get("sureNummer"));
  const vonVers = Number(searchParams.get("vonVers"));
  const bisVers = Number(searchParams.get("bisVers"));
  if (!sureNummer || !vonVers || !bisVers) {
    return NextResponse.json({ error: "sureNummer, vonVers und bisVers sind erforderlich." }, { status: 400 });
  }

  try {
    const verse = await holeVersBereich(sureNummer, vonVers, bisVers);
    const { bezeichnung, text } = formatiereKoranZitat(verse);
    return NextResponse.json({ bezeichnung, text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Abruf fehlgeschlagen." },
      { status: 502 },
    );
  }
}
