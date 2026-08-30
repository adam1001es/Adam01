import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, erzeugeVerifizierungsToken } from "@/lib/auth";
import { sendeVerifizierungsMail } from "@/lib/mailer";

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
  const { token, ablauf } = erzeugeVerifizierungsToken();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      // Der erste registrierte Account (i.d.R. der/die Betreiber:in) wird automatisch Admin,
      // da es noch keinen anderen Weg gibt, den Admin-Status zu vergeben.
      role: nutzerAnzahl === 0 ? "admin" : "user",
      verifizierungsToken: token,
      verifizierungsTokenAblauf: ablauf,
    },
  });

  const basisUrl = request.nextUrl.origin;
  try {
    await sendeVerifizierungsMail(email, `${basisUrl}/api/auth/verify?token=${token}`);
  } catch (err) {
    // Konto ohne funktionierenden Mailversand wäre nie verifizierbar (und würde die
    // E-Mail-Adresse dauerhaft blockieren) - daher lieber zurückrollen und einen klaren Fehler
    // zurückgeben, statt ein unbestätigbares Konto anzulegen.
    console.error("Verifizierungs-Mail konnte nicht gesendet werden:", err);
    await prisma.user.delete({ where: { id: user.id } });
    return NextResponse.json(
      {
        error:
          "Registrierung konnte nicht abgeschlossen werden - die Bestätigungs-Mail konnte nicht gesendet werden. Bitte später erneut versuchen oder die Person kontaktieren, die den Zugang verwaltet.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, pending: true, email });
}
