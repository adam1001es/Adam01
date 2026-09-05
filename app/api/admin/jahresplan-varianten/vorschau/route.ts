import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { parseJahresplanVorlage } from "@/lib/jahresplanImport";

export const runtime = "nodejs";

/** Erster Schritt des Admin-Uploads künftiger Jahresplanungs-Vorlagen (siehe
 * app/admin/jahresplan-varianten): parst die hochgeladene .docx NUR und liefert das Ergebnis zur
 * Kontrolle zurück - speichert NICHTS. Erst nach Bestätigung (ggf. mit Korrekturen) persistiert
 * POST /api/admin/jahresplan-varianten die Daten. Bewusst zweigeteilt, siehe lib/jahresplanImport.ts:
 * die Vorlage enthält Eigenheiten (z.B. teils doppelt vorkommende Feiertagsnamen), die ein
 * Mensch schneller erkennt als ein Parser. */
export async function POST(request: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const datei = formData.get("datei");
  if (!(datei instanceof File)) {
    return NextResponse.json({ error: "Bitte eine Datei hochladen." }, { status: 400 });
  }
  if (!datei.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ error: "Bitte eine .docx-Datei hochladen." }, { status: 400 });
  }

  let ergebnis;
  try {
    const buffer = Buffer.from(await datei.arrayBuffer());
    ergebnis = await parseJahresplanVorlage(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Datei konnte nicht gelesen werden.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const ersteWoche = ergebnis.wochen[0];
  const letzteWoche = ergebnis.wochen[ergebnis.wochen.length - 1];
  const [vonJahr, vonMonat, vonTag] = ersteWoche.von.split("-");
  const bisJahr = parseInt(letzteWoche.bis.slice(0, 4), 10);
  const vorschlag = {
    varianteId: ersteWoche.von,
    label: `Schulbeginn ${vonTag}.${vonMonat}.${vonJahr}`,
    schuljahr: `${vonJahr}/${String(bisJahr).slice(2)}`,
  };

  return NextResponse.json({ wochen: ergebnis.wochen, warnungen: ergebnis.warnungen, vorschlag });
}
