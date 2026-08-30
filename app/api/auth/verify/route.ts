import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

/** Wird über den Link in der Bestätigungs-Mail aufgerufen (siehe lib/mailer.ts). Bei Erfolg
 * wird die E-Mail als verifiziert markiert und der Nutzer direkt eingeloggt. */
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

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiziert: true, verifizierungsToken: null, verifizierungsTokenAblauf: null },
  });

  await createSession(user.id);

  return NextResponse.redirect(`${basisUrl}/?verifizierung=erfolgreich`);
}
