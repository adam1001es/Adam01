import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { geprüfteHadithe, ermittleHadithSammlung, kuerzeZitatVorschau } from "@/lib/wissensbasis";

/** Für den Hadith-Auswahl-Picker im Erstellen-Formular (siehe NewWorksheetForm.tsx) - jede
 * angemeldete Lehrkraft, nicht admin-only (im Unterschied zur Wissensbasis-Nachschlagemaske),
 * analog zu app/api/koran/suren/route.ts. Liefert bewusst NUR bereits geprüfte Einträge.
 * "textVorschau" ist bewusst gekürzt statt des vollen Hadith-Wortlauts (siehe
 * kuerzeZitatVorschau) - die Liste wächst mit der Zeit auf mehrere Hundert Einträge (Nawawi 40,
 * dann Bukhari/Muslim), da soll die Übersicht nicht jeden Hadith komplett ausschreiben. Der volle
 * Text kommt bei tatsächlicher Auswahl ohnehin über holeHadithEintrag in die Generierung, nicht
 * aus dieser Liste. "sammlung" dient als Filter-Kategorie (siehe ermittleHadithSammlung). */
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
      sammlung: ermittleHadithSammlung(h.inhalt),
      bezeichnung: h.inhalt.bezeichnung,
      textVorschau: h.inhalt.text ? kuerzeZitatVorschau(h.inhalt.text) : undefined,
    })),
  });
}
