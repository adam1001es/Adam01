import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

const BodySchema = z.object({
  token: z.string().min(1),
  neuesPasswort: z.string().min(8, "Das neue Passwort muss mindestens 8 Zeichen haben."),
});

/** Setzt ein Passwort über den Link aus der Reset-Mail (siehe app/api/auth/passwort-vergessen)
 * zurück und loggt direkt ein - kein manueller Login-Umweg nötig. */
export async function POST(request: NextRequest) {
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

  const user = await prisma.user.findUnique({ where: { passwortResetToken: parsed.data.token } });
  if (!user || !user.passwortResetTokenAblauf || user.passwortResetTokenAblauf < new Date()) {
    return NextResponse.json(
      { error: "Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an." },
      { status: 400 },
    );
  }

  const neuerHash = await hashPassword(parsed.data.neuesPasswort);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: neuerHash, passwortResetToken: null, passwortResetTokenAblauf: null },
  });

  await createSession(user.id);

  return NextResponse.json({ ok: true });
}
