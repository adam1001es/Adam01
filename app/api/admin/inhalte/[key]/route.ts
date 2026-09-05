import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { SITE_CONTENT_FELDER, SITE_CONTENT_MAX_LAENGE } from "@/lib/siteContent";

const BodySchema = z.object({ value: z.string() });

// Admin-exklusiv (KEIN hatModRechte() wie bei Forum/Wissensbasis) - Inhalte/Design der ganzen
// App zu überschreiben ist bewusst nicht Teil des Moderator-Umfangs, siehe lib/rollen.ts.
async function pruefeAdminUndFeld(key: string) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return { fehler: NextResponse.json({ error: "Kein Zugriff." }, { status: 403 }) } as const;
  }
  const feld = SITE_CONTENT_FELDER.find((f) => f.key === key);
  if (!feld) {
    return { fehler: NextResponse.json({ error: "Unbekanntes Feld." }, { status: 404 }) } as const;
  }
  return { admin, feld } as const;
}

export async function PATCH(request: NextRequest, { params }: { params: { key: string } }) {
  const geprueft = await pruefeAdminUndFeld(params.key);
  if ("fehler" in geprueft) return geprueft.fehler;
  const { admin, feld } = geprueft;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger Wert." }, { status: 400 });
  }

  const wert = feld.typ === "bild" ? parsed.data.value : parsed.data.value.trim();

  if (wert.length === 0) {
    return NextResponse.json(
      { error: "Leerer Wert - zum Entfernen bitte „Auf Standard zurücksetzen“ verwenden." },
      { status: 400 },
    );
  }
  if (wert.length > SITE_CONTENT_MAX_LAENGE[feld.typ]) {
    return NextResponse.json({ error: "Wert ist zu lang." }, { status: 400 });
  }
  if (feld.typ === "bild" && !wert.startsWith("data:image/")) {
    return NextResponse.json({ error: "Kein gültiges Bild." }, { status: 400 });
  }

  await prisma.siteContent.upsert({
    where: { key: feld.key },
    create: { key: feld.key, type: feld.typ, value: wert, updatedBy: admin.id },
    update: { value: wert, updatedBy: admin.id },
  });

  return NextResponse.json({ value: wert });
}

// Setzt das Feld auf den Code-Standard zurück (siehe SiteContentFeld.standard) - löscht die
// gesamte Zeile statt nur value=null zu setzen, damit updatedBy/updatedAt nicht fälschlich einen
// "zuletzt bearbeitet"-Stand vom vorherigen Override zeigen.
export async function DELETE(_request: NextRequest, { params }: { params: { key: string } }) {
  const geprueft = await pruefeAdminUndFeld(params.key);
  if ("fehler" in geprueft) return geprueft.fehler;
  const { feld } = geprueft;

  await prisma.siteContent.deleteMany({ where: { key: feld.key } });

  return NextResponse.json({ value: feld.standard });
}
