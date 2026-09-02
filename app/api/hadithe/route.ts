import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { geprüfteHadithe } from "@/lib/wissensbasis";

/** Für den Hadith-Auswahl-Picker im Erstellen-Formular (siehe NewWorksheetForm.tsx) - jede
 * angemeldete Lehrkraft, nicht admin-only (im Unterschied zur Wissensbasis-Nachschlagemaske),
 * analog zu app/api/koran/suren/route.ts. Liefert bewusst NUR bereits geprüfte Einträge. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  }

  const hadithe = await geprüfteHadithe();
  return NextResponse.json({
    hadithe: hadithe.map((h) => ({
      id: h.id,
      themenbereich: h.themenbereich,
      bezeichnung: h.inhalt.bezeichnung,
      text: h.inhalt.text,
      kontext: h.inhalt.kontext,
    })),
  });
}
