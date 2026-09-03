import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istGueltigeAvatarFarbe } from "@/lib/profil";

// Nur die kuratierte Farbauswahl aus lib/profil.ts ist erlaubt (kein Freitext/Upload) - siehe
// dort für die Begründung. Hintergrund- und Buchstabenfarbe kommen bewusst aus derselben Palette
// und werden unabhängig voneinander validiert/gespeichert. Das Profilbild selbst (Initialen) wird
// nicht hier, sondern live aus dem Benutzernamen berechnet (siehe avatarInitialen) - dafür gibt
// es kein eigenes Feld zu speichern.
const BodySchema = z.object({
  avatarFarbe: z.string().refine(istGueltigeAvatarFarbe, "Unbekannte Hintergrundfarbe."),
  avatarTextFarbe: z.string().refine(istGueltigeAvatarFarbe, "Unbekannte Buchstabenfarbe."),
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
    data: {
      avatarFarbe: parsed.data.avatarFarbe,
      avatarTextFarbe: parsed.data.avatarTextFarbe,
    },
  });
  return NextResponse.json({
    avatarFarbe: updated.avatarFarbe,
    avatarTextFarbe: updated.avatarTextFarbe,
  });
}
