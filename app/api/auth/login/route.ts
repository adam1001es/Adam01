import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

// "kennung" ist E-Mail ODER Benutzername - Benutzername ist erst nach der ersten Anmeldung
// setzbar (siehe app/account), daher hier bewusst kein enges E-Mail-Format erzwungen.
const LoginSchema = z.object({
  kennung: z.string().min(1),
  passwort: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte E-Mail/Benutzername und Passwort angeben." }, { status: 400 });
  }
  const kennung = parsed.data.kennung.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: kennung }, { username: kennung }] },
  });
  const gueltig = user ? await verifyPassword(parsed.data.passwort, user.passwordHash) : false;

  if (!user || !gueltig) {
    return NextResponse.json({ error: "E-Mail/Benutzername oder Passwort ist falsch." }, { status: 401 });
  }

  if (!user.emailVerifiziert) {
    return NextResponse.json(
      {
        error: "Bitte bestätige zuerst deine E-Mail-Adresse (Link in der Mail nach der Registrierung).",
        unverifiziert: true,
        email: user.email,
      },
      { status: 403 },
    );
  }

  await createSession(user.id);

  return NextResponse.json({ ok: true });
}
