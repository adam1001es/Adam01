import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istGueltigeAvatarEmoji, istGueltigeAvatarFarbe } from "@/lib/profil";

// Nur die kuratierte Auswahl aus lib/profil.ts ist erlaubt (kein Freitext/Upload) - siehe dort
// für die Begründung.
const BodySchema = z.object({
  avatarEmoji: z.string().refine(istGueltigeAvatarEmoji, "Unbekanntes Avatar-Symbol."),
  avatarFarbe: z.string().refine(istGueltigeAvatarFarbe, "Unbekannte Avatar-Farbe."),
});

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
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
      { error: parsed.error.errors[0]?.message ?? "Ungültige Auswahl." },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatarEmoji: parsed.data.avatarEmoji, avatarFarbe: parsed.data.avatarFarbe },
  });
  return NextResponse.json({ avatarEmoji: updated.avatarEmoji, avatarFarbe: updated.avatarFarbe });
}
