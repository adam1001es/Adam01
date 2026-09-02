import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { sammleZitatKandidaten } from "@/lib/wissensMining";

/** Stößt das Zitat-Mining manuell an (siehe lib/wissensMining.ts) - durchsucht eigene +
 * geteilte Arbeitsblätter nach Quellenangaben und legt neue Entwürfe an. Bewusst ein manueller
 * Button statt eines automatischen Jobs: der Admin soll bewusst entscheiden, wann ein neuer
 * Scan-Durchlauf sinnvoll ist (z.B. nachdem einige neue Arbeitsblätter dazugekommen sind). */
export async function POST() {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const ergebnis = await sammleZitatKandidaten(admin.id);
  return NextResponse.json(ergebnis);
}
