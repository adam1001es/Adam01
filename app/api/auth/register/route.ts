import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

const RegisterSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse angeben."),
  passwort: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben."),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 },
    );
  }
  const email = parsed.data.email.toLowerCase().trim();

  const vorhanden = await prisma.user.findUnique({ where: { email } });
  if (vorhanden) {
    return NextResponse.json({ error: "Für diese E-Mail-Adresse existiert bereits ein Konto." }, { status: 409 });
  }

  const nutzerAnzahl = await prisma.user.count();
  const passwordHash = await hashPassword(parsed.data.passwort);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      // Der erste registrierte Account (i.d.R. der/die Betreiber:in) wird automatisch Admin,
      // da es noch keinen anderen Weg gibt, den Admin-Status zu vergeben.
      role: nutzerAnzahl === 0 ? "admin" : "user",
    },
  });

  await createSession(user.id);

  return NextResponse.json({ ok: true });
}
