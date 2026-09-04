import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { StundenplanEintragEingabeSchema } from "@/lib/stundenplan";

/** Bearbeiten/Löschen eines einzelnen Stundenplan-Eintrags - beides nur für die Lehrkraft, der
 * der Eintrag gehört (siehe app/werkzeuge/stundenplan). */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const bestehend = await prisma.stundenplanEintrag.findUnique({ where: { id: params.id } });
  if (!bestehend || bestehend.userId !== user.id) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

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

  const eintrag = await prisma.stundenplanEintrag.update({
    where: { id: params.id },
    data: {
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

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const bestehend = await prisma.stundenplanEintrag.findUnique({ where: { id: params.id } });
  if (!bestehend || bestehend.userId !== user.id) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  await prisma.stundenplanEintrag.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
