import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// Lateinische UND arabische Buchstaben (Groß-/Kleinschreibung bei lateinischen erlaubt, damit man
// seinen Namen z.B. "AhmadY" statt zwingend "ahmady" schreiben kann - Arabisch kennt keine
// Groß-/Kleinschreibung), Ziffern, Punkt, Bindestrich, Unterstrich. ؀-ۿ (arabischer
// Grundblock) plus ݐ-ݿ (Arabic Supplement, u.a. für Urdu/Persisch genutzte
// Zusatzbuchstaben). Der Login (siehe app/api/auth/login) vergleicht Benutzernamen
// case-insensitive, damit die Groß-/Kleinschreibung beim Einloggen keine Rolle spielt.
const BodySchema = z.object({
  username: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9._؀-ۿݐ-ݿ-]{3,20}$/,
      "3-20 Zeichen: lateinische oder arabische Buchstaben, Ziffern, Punkt, Bindestrich, Unterstrich.",
    ),
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
      { error: parsed.error.errors[0]?.message ?? "Ungültiger Benutzername." },
      { status: 400 },
    );
  }

  // Die DB-Spalte selbst ist case-sensitiv eindeutig (Postgres-Standard), erlaubt also technisch
  // "AhmadY" UND "ahmady" gleichzeitig - das würde den case-insensitiven Login (siehe
  // app/api/auth/login) mehrdeutig machen. Deshalb hier zusätzlich eine explizite
  // case-insensitive Prüfung VOR dem Schreiben; der P2002-Fang unten bleibt als Absicherung für
  // den (seltenen) exakten Doppel-Fall bestehen.
  const kollision = await prisma.user.findFirst({
    where: {
      username: { equals: parsed.data.username, mode: "insensitive" },
      NOT: { id: user.id },
    },
    select: { id: true },
  });
  if (kollision) {
    return NextResponse.json({ error: "Dieser Benutzername ist schon vergeben." }, { status: 409 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { username: parsed.data.username },
    });
    return NextResponse.json({ username: updated.username });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Dieser Benutzername ist schon vergeben." }, { status: 409 });
    }
    throw err;
  }
}
