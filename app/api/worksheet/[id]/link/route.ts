import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const BodySchema = z.object({ aktiv: z.boolean() });

/** Schaltet den öffentlichen, nicht angemeldeten Link-Zugriff auf ein Arbeitsblatt frei bzw.
 * widerruft ihn (siehe app/blatt/[token], components/LinkTeilenButton.tsx) - bewusst getrennt
 * von app/api/worksheet/[id]/teilen (Community-Sichtbarkeit nur unter zahlenden Abo-Konten):
 * für diesen Link braucht es gar kein Konto, gedacht z.B. für den Versand über WhatsApp statt
 * PDF herunterzuladen und woanders wieder hochzuladen. Deshalb auch nicht auf
 * istZahlendesKonto beschränkt - reine Eigennutzung des eigenen Arbeitsblatts, kein
 * Community-Discovery-Feature. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!worksheet || worksheet.userId !== user.id) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  if (!parsed.data.aktiv) {
    // Token wird komplett verworfen statt nur ein Flag umzuschalten, damit ein bereits
    // weitergegebener Link nach dem Widerruf endgültig ungültig ist.
    await prisma.worksheet.update({
      where: { id: worksheet.id },
      data: { oeffentlicherLinkToken: null },
    });
    return NextResponse.json({ token: null });
  }

  // Bereits aktiv: denselben Token zurückgeben statt einen neuen zu erzeugen (idempotent) - ein
  // erneutes Aktivieren derselben Freigabe soll nicht bereits verteilte Links entwerten.
  if (worksheet.oeffentlicherLinkToken) {
    return NextResponse.json({ token: worksheet.oeffentlicherLinkToken });
  }

  const token = randomBytes(32).toString("hex");
  await prisma.worksheet.update({
    where: { id: worksheet.id },
    data: { oeffentlicherLinkToken: token },
  });
  return NextResponse.json({ token });
}
