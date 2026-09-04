import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { holeVersBereich } from "@/lib/quranApi";

/** Für "Koran durchsuchen" in der Koran- & Hadith-Bibliothek (siehe app/werkzeuge/zitate,
 * components/KoranDurchsuchen.tsx) - liefert Arabisch + deutsche Übersetzung live von der
 * Al-Quran-Cloud-API, für JEDES eingeloggte Konto (kein Admin-Gate wie beim
 * Wissensbasis-Nachschlagewerkzeug): der Korantext selbst ist keine prüfungsbedürftige Behauptung
 * wie ein Hadith-Zitat, sondern ein direkter, live abgerufener Wortlaut aus einer lizenzierten
 * Quelle - dafür braucht es keine manuelle Admin-Freigabe. Siehe lib/quranApi.ts für den
 * Copyright-Hintergrund (Bubenheim & Elyas-Übersetzung wird bewusst NIE auf Vorrat gespeichert,
 * nur live pro Anfrage ausgeliefert). */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sure = Number(searchParams.get("sure"));
  const von = Number(searchParams.get("von"));
  const bisRoh = searchParams.get("bis");
  const bis = bisRoh ? Number(bisRoh) : von;

  if (!Number.isInteger(sure) || sure < 1 || sure > 114) {
    return NextResponse.json({ error: "Ungültige Sure-Nummer (1-114)." }, { status: 400 });
  }
  if (!Number.isInteger(von) || von < 1) {
    return NextResponse.json({ error: "Ungültige Vers-Nummer." }, { status: 400 });
  }
  if (!Number.isInteger(bis)) {
    return NextResponse.json({ error: "Ungültige „bis“-Vers-Nummer." }, { status: 400 });
  }

  try {
    const verse = await holeVersBereich(sure, von, bis);
    return NextResponse.json({ verse });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Abruf fehlgeschlagen." },
      { status: 502 },
    );
  }
}
