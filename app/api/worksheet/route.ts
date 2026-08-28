import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const { count } = await prisma.worksheet.deleteMany({});
  return NextResponse.json({ ok: true, geloescht: count });
}
