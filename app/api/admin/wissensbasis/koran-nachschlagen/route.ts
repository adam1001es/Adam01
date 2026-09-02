import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { holeVersBereich } from "@/lib/quranApi";

/** Admin-only Live-Nachschlagewerkzeug für die Wissensbasis (siehe lib/quranApi.ts) - holt
 * Vers(e) direkt von der Al-Quran-Cloud-API statt sie gespeichert/erinnert zu haben. */
export async function GET(request: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
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
