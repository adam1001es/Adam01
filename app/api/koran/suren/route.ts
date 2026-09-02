import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { holeAlleSuren } from "@/lib/quranApi";

/** Für den Sure-Auswahl-Picker im Erstellen-Formular (siehe NewWorksheetForm.tsx) - jede
 * angemeldete Lehrkraft, nicht admin-only (im Unterschied zur Wissensbasis-Nachschlagemaske). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  }

  try {
    const suren = await holeAlleSuren();
    return NextResponse.json({ suren });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Abruf fehlgeschlagen." },
      { status: 502 },
    );
  }
}
