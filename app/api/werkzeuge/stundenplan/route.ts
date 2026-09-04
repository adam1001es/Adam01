import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { StundenplanEintragEingabeSchema } from "@/lib/stundenplan";

/** Legt einen neuen Stundenplan-Eintrag an (siehe app/werkzeuge/stundenplan) - für jedes
 * eingeloggte Konto frei verfügbar, kein KI-Aufruf/Kontingent, rein persönliche Verwaltungsdaten
 * ohne Bezug zu Klasse/Schueler (siehe Kommentar bei StundenplanEintrag im Prisma-Schema). */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }
  const parsed = StundenplanEintragEingabeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 },
    );
  }

  const eintrag = await prisma.stundenplanEintrag.create({
    data: {
      userId: user.id,
      wochentag: parsed.data.wochentag,
      beginn: parsed.data.beginn,
      ende: parsed.data.ende,
      schule: parsed.data.schule?.trim() || null,
      klasse: parsed.data.klasse?.trim() || null,
      schuelerangabe: parsed.data.schuelerangabe?.trim() || null,
      istPause: parsed.data.istPause ?? false,
    },
  });
  return NextResponse.json({ eintrag });
}
