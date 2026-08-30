import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// Nur Kleinbuchstaben/Ziffern/._- , damit der Benutzername beim Login eindeutig und ohne
// Groß-/Kleinschreibungs-Verwirrung eingegeben werden kann (siehe app/api/auth/login).
const BodySchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,20}$/, "3-20 Zeichen: Kleinbuchstaben, Ziffern, Punkt, Bindestrich, Unterstrich."),
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
