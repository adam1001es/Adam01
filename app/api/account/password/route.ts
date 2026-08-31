import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyPassword, hashPassword } from "@/lib/auth";

const BodySchema = z.object({
  aktuellesPasswort: z.string().min(1, "Bitte das aktuelle Passwort eingeben."),
  neuesPasswort: z.string().min(8, "Das neue Passwort muss mindestens 8 Zeichen haben."),
});

export async function PATCH(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Konto nicht gefunden." }, { status: 404 });
  }

  const stimmt = await verifyPassword(parsed.data.aktuellesPasswort, user.passwordHash);
  if (!stimmt) {
    return NextResponse.json({ error: "Das aktuelle Passwort ist nicht korrekt." }, { status: 400 });
  }

  const neuerHash = await hashPassword(parsed.data.neuesPasswort);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: neuerHash } });

  return NextResponse.json({ ok: true });
}
