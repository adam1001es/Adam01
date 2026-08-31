import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

/** Wird über den Link in der Bestätigungs-Mail aufgerufen (siehe lib/mailer.ts) - für zwei
 * unterschiedliche Vorgänge, die sich beide denselben verifizierungsToken teilen (schließen
 * sich zeitlich aus, siehe pendingEmail in prisma/schema.prisma): die ursprüngliche
 * Registrierungs-Bestätigung (pendingEmail leer) und die Bestätigung einer E-Mail-Änderung im
 * bestehenden Konto (siehe app/api/account/email, pendingEmail gesetzt). */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const basisUrl = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${basisUrl}/login?verifizierung=fehlt`);
  }

  const user = await prisma.user.findUnique({ where: { verifizierungsToken: token } });
  if (!user || !user.verifizierungsTokenAblauf || user.verifizierungsTokenAblauf < new Date()) {
    return NextResponse.redirect(`${basisUrl}/login?verifizierung=ungueltig`);
  }

  if (user.pendingEmail) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.pendingEmail,
          pendingEmail: null,
          verifizierungsToken: null,
          verifizierungsTokenAblauf: null,
        },
      });
    } catch (err) {
      // Zwischen Anfrage und Bestätigung könnte sich die Wunsch-Adresse anderweitig vergeben
      // haben (E-Mail ist @unique) - seltener Sonderfall, aber ohne Abfangen würde der Klick auf
      // den Link mit einem rohen 500er enden statt einer verständlichen Meldung.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.redirect(`${basisUrl}/account?emailAenderung=vergeben`);
      }
      throw err;
    }

    await createSession(user.id);
    return NextResponse.redirect(`${basisUrl}/account?emailAenderung=erfolgreich`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiziert: true, verifizierungsToken: null, verifizierungsTokenAblauf: null },
  });

  await createSession(user.id);

  return NextResponse.redirect(`${basisUrl}/?verifizierung=erfolgreich`);
}
