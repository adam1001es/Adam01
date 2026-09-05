import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hatModRechte } from "@/lib/rollen";

export const runtime = "nodejs";

/** Liefert den optionalen Screenshot einer Meldung aus (siehe Meldung.screenshot,
 * lib/meldungFix.ts) - anders als /api/generated-image/[id] NICHT öffentlich: ein Screenshot kann
 * den Bildschirm einer Lehrkraft mit sonstigen sichtbaren Informationen zeigen, daher nur für
 * Admin/Moderation sichtbar (analog zur Zugriffsprüfung von app/admin/meldungen/page.tsx). */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user || !hatModRechte(user)) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }

  const meldung = await prisma.meldung.findUnique({
    where: { id: params.id },
    select: { screenshot: true, screenshotMimeType: true },
  });
  if (!meldung?.screenshot || !meldung.screenshotMimeType) {
    return NextResponse.json({ error: "Kein Screenshot vorhanden." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(meldung.screenshot), {
    headers: {
      "Content-Type": meldung.screenshotMimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
