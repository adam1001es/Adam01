import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { importiereZitateVonLink } from "@/lib/linkImport";

/** Admin-only Link-Import (siehe lib/linkImport.ts) - Gegenstück zu koran-nachschlagen für
 * Hadith/Tafsir, für die es keine geprüfte deutsche Live-API gibt: der Admin gibt eine URL an, wir
 * übernehmen nur das mechanische Abschreiben + eine automatische Grundkompetenz-Einordnung, für
 * ALLE auf der Seite gefundenen Zitate (z.B. jeden Hadith einer ganzen Sammlung) auf einmal. */
export async function POST(request: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }
  const url = (body as { url?: unknown }).url;
  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "Bitte eine URL angeben." }, { status: 400 });
  }

  try {
    const ergebnis = await importiereZitateVonLink(url.trim());
    return NextResponse.json(ergebnis);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import fehlgeschlagen." },
      { status: 502 },
    );
  }
}
