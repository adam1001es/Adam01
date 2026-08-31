import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyPassword, erzeugeVerifizierungsToken } from "@/lib/auth";
import { sendeEmailAenderungsMail } from "@/lib/mailer";

const BodySchema = z.object({
  neueEmail: z.string().email("Bitte eine gültige E-Mail-Adresse angeben."),
  aktuellesPasswort: z.string().min(1, "Bitte das aktuelle Passwort eingeben."),
});

/** Ändert die Anmelde-E-Mail-Adresse eines Kontos NICHT sofort, sondern setzt sie nur als
 * "pendingEmail" und schickt eine Bestätigungsmail an die neue Adresse (siehe
 * app/api/auth/verify) - erst nach Klick auf den Link darin wird sie aktiv. Verlangt zusätzlich
 * das aktuelle Passwort: ohne diese Hürde könnte ein gestohlenes Session-Cookie allein genügen,
 * um die Anmelde-Adresse auf eine fremde E-Mail umzubiegen und das Konto zu übernehmen. */
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
  const neueEmail = parsed.data.neueEmail.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Konto nicht gefunden." }, { status: 404 });
  }

  const stimmt = await verifyPassword(parsed.data.aktuellesPasswort, user.passwordHash);
  if (!stimmt) {
    return NextResponse.json({ error: "Das aktuelle Passwort ist nicht korrekt." }, { status: 400 });
  }

  if (neueEmail === user.email) {
    return NextResponse.json({ error: "Das ist bereits deine aktuelle E-Mail-Adresse." }, { status: 400 });
  }

  const vorhanden = await prisma.user.findFirst({
    where: { OR: [{ email: neueEmail }, { pendingEmail: neueEmail }], NOT: { id: user.id } },
  });
  if (vorhanden) {
    return NextResponse.json(
      { error: "Für diese E-Mail-Adresse existiert bereits ein Konto." },
      { status: 409 },
    );
  }

  const { token, ablauf } = erzeugeVerifizierungsToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { pendingEmail: neueEmail, verifizierungsToken: token, verifizierungsTokenAblauf: ablauf },
  });

  const basisUrl = request.nextUrl.origin;
  try {
    await sendeEmailAenderungsMail(neueEmail, `${basisUrl}/api/auth/verify?token=${token}`);
  } catch (err) {
    // Ohne funktionierenden Mailversand wäre die Änderung nie bestätigbar - lieber zurückrollen
    // und einen klaren Fehler zurückgeben, statt eine hängende, unbestätigbare pendingEmail zu
    // hinterlassen (dieselbe Logik wie bei der Registrierung, siehe app/api/auth/register).
    console.error("Bestätigungs-Mail für E-Mail-Änderung konnte nicht gesendet werden:", err);
    await prisma.user.update({
      where: { id: user.id },
      data: { pendingEmail: null, verifizierungsToken: null, verifizierungsTokenAblauf: null },
    });
    return NextResponse.json(
      { error: "Bestätigungs-Mail konnte nicht gesendet werden. Bitte später erneut versuchen." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, pendingEmail: neueEmail });
}
