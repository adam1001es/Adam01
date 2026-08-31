import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { erzeugePasswortResetToken } from "@/lib/auth";
import { sendePasswortResetMail } from "@/lib/mailer";

const BodySchema = z.object({ email: z.string().email() });

// Immer dieselbe, neutrale Antwort - egal ob die E-Mail existiert -, damit sich damit nicht
// ausspähen lässt, welche E-Mail-Adressen registriert sind (analog zu resend-verification).
const NEUTRALE_ANTWORT = {
  ok: true,
  message: "Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde gerade eine Mail zum Zurücksetzen des Passworts gesendet.",
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const { token, ablauf } = erzeugePasswortResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { passwortResetToken: token, passwortResetTokenAblauf: ablauf },
    });
    try {
      await sendePasswortResetMail(
        email,
        `${request.nextUrl.origin}/passwort-zuruecksetzen?token=${token}`,
      );
    } catch (err) {
      console.error("Passwort-Reset-Mail konnte nicht gesendet werden:", err);
    }
  }

  return NextResponse.json(NEUTRALE_ANTWORT);
}
