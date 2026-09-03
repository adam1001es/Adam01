import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { holeHadithEintrag } from "@/lib/wissensbasis";

/** Liefert den VOLLEN Wortlaut eines einzelnen geprüften Hadith-Zitats (siehe
 * app/api/hadithe/route.ts für die gekürzte Übersichtsliste) - für "Aufgabe hinzufügen" auf der
 * Bearbeiten-Seite (siehe EditWorksheetForm.tsx), wenn die Lehrkraft einen Hadith direkt als
 * Lesetext-Aufgabe übernehmen möchte, statt ihn per KI generieren zu lassen. Kein Claude-Aufruf,
 * kein Kontingent-Verbrauch - reiner Datenbank-Lookup. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  }

  const eintrag = await holeHadithEintrag(params.id);
  if (!eintrag) {
    return NextResponse.json({ error: "Dieser Hadith ist nicht (mehr) verfügbar." }, { status: 404 });
  }

  return NextResponse.json({
    bezeichnung: eintrag.inhalt.bezeichnung,
    text: eintrag.inhalt.text ?? "",
    kontext: eintrag.inhalt.kontext,
  });
}
