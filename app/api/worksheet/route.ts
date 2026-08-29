import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const { count } = await prisma.worksheet.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true, geloescht: count });
}
