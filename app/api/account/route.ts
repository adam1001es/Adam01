import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyPassword, destroySession } from "@/lib/auth";

// Muss exakt eingetippt werden (siehe KontoLoeschenForm.tsx) - zusätzliche Absicherung neben dem
// Passwort, damit ein Konto nicht durch einen einzigen versehentlichen Klick verschwindet.
const BESTAETIGUNGSWORT = "LÖSCHEN";

const BodySchema = z.object({
  passwort: z.string().min(1, "Bitte das aktuelle Passwort eingeben."),
  bestaetigung: z.string().min(1, `Bitte "${BESTAETIGUNGSWORT}" zur Bestätigung eintippen.`),
});

// Self-Service-Kontolöschung für normale Konten (siehe app/account, KontoLoeschenForm.tsx).
// Admin-Konten sind bewusst ausgenommen - dieselbe Regel wie beim Admin-eigenen
// DELETE /api/admin/users/[id] (dort kann ein Admin ebenfalls nicht sich selbst löschen), hier
// zusätzlich präventiv: das Konto sieht die Löschen-Sektion auf der Kontoseite gar nicht erst
// (siehe app/account/page.tsx).
export async function DELETE(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  }

  if (sessionUser.role === "admin") {
    return NextResponse.json(
      { error: "Admin-Konten können sich nicht selbst löschen - bitte ein anderes Admin-Konto kontaktieren." },
      { status: 403 },
    );
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

  if (parsed.data.bestaetigung.trim().toUpperCase() !== BESTAETIGUNGSWORT) {
    return NextResponse.json(
      { error: `Bitte tippe genau "${BESTAETIGUNGSWORT}" zur Bestätigung ein.` },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Konto nicht gefunden." }, { status: 404 });
  }

  const stimmt = await verifyPassword(parsed.data.passwort, user.passwordHash);
  if (!stimmt) {
    return NextResponse.json({ error: "Das Passwort ist nicht korrekt." }, { status: 400 });
  }

  // Arbeitsblätter bleiben erhalten (Worksheet.userId wird per Schema auf null gesetzt, genau
  // wie beim Admin-Löschen, siehe app/api/admin/users/[id]/route.ts) - alles andere, was direkt
  // am Konto hängt (Klassen inkl. Schüler:innen/Zuweisungen/Ergebnisse, Forum-Beiträge inkl.
  // Antworten anderer auf eigene Themen, Sessions, Nutzungszähler) fällt per Schema-Kaskade weg.
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();

  return NextResponse.json({ ok: true });
}
