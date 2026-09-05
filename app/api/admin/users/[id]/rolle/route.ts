import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ROLLEN } from "@/lib/rollen";

const BodySchema = z.object({ rolle: z.enum(ROLLEN) });

// Rollen-Vergabe (user/moderator/admin) - bewusst eine eigene Route statt Erweiterung von
// PATCH /api/admin/users/[id] (das steuert nur tier/tierGueltigVon/Bis, siehe AdminTierForm),
// exakt dieselbe Konvention wie /forum-sperre daneben. Admin-exklusiv: ein Moderator darf zwar
// Forum/Wissensbasis moderieren (siehe lib/rollen.ts), aber niemanden befördern - sonst könnte
// sich ein Moderator selbst oder gegenseitig zum Admin machen.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  if (params.id === admin.id) {
    return NextResponse.json(
      { error: "Du kannst deine eigene Rolle nicht selbst ändern - bitte ein anderes Admin-Konto bitten." },
      { status: 400 },
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
    return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Konto nicht gefunden." }, { status: 404 });
  }

  // Verhindert, dass versehentlich das letzte verbleibende Admin-Konto degradiert wird und
  // dadurch niemand mehr Zugriff auf die Kontenverwaltung/Rollen-Vergabe hätte.
  if (target.role === "admin" && parsed.data.rolle !== "admin") {
    const adminAnzahl = await prisma.user.count({ where: { role: "admin" } });
    if (adminAnzahl <= 1) {
      return NextResponse.json(
        { error: "Das letzte Admin-Konto kann nicht degradiert werden." },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { role: parsed.data.rolle },
  });

  return NextResponse.json({ role: updated.role });
}
