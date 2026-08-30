import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { erzeugeVerifizierungsToken } from "@/lib/auth";
import { sendeVerifizierungsMail } from "@/lib/mailer";

const BodySchema = z.object({ email: z.string().email() });

// Immer dieselbe, neutrale Antwort - egal ob die E-Mail existiert, schon verifiziert ist oder
// nicht -, damit sich damit nicht ausspähen lässt, welche E-Mail-Adressen registriert sind.
const NEUTRALE_ANTWORT = {
  ok: true,
  message:
    "Falls ein noch nicht bestätigtes Konto mit dieser E-Mail-Adresse existiert, wurde gerade eine neue Bestätigungs-Mail gesendet.",
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
  if (user && !user.emailVerifiziert) {
    const { token, ablauf } = erzeugeVerifizierungsToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { verifizierungsToken: token, verifizierungsTokenAblauf: ablauf },
    });
    try {
      await sendeVerifizierungsMail(email, `${request.nextUrl.origin}/api/auth/verify?token=${token}`);
    } catch (err) {
      console.error("Erneute Verifizierungs-Mail konnte nicht gesendet werden:", err);
    }
  }

  return NextResponse.json(NEUTRALE_ANTWORT);
}
