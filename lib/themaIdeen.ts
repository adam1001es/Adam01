import { prisma } from "./prisma";

/** Tägliches (nicht monatliches) Limit für die KI-Themenideen-Funktion - ein spontanes
 * Kreativitäts-Hilfsmittel für Lehrkräfte, die gerade keine eigene Idee haben, kein Ersatz für
 * das eigentliche Arbeitsblatt-Kontingent (lib/quota.ts). Admin-Konten sind ausgenommen (siehe
 * app/api/thema-ideen/route.ts), analog zum unbegrenzten Arbeitsblatt-Kontingent. */
export const THEMA_IDEEN_TAGESLIMIT = 10;

function heutigerTag(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export interface ThemaIdeenStatus {
  verbraucht: number;
  limit: number;
  verbleibend: number;
}

export async function getThemaIdeenStatus(userId: string): Promise<ThemaIdeenStatus> {
  const eintrag = await prisma.themaIdeenUsage.findUnique({
    where: { userId_tag: { userId, tag: heutigerTag() } },
  });
  const verbraucht = eintrag?.anzahl ?? 0;
  return {
    verbraucht,
    limit: THEMA_IDEEN_TAGESLIMIT,
    verbleibend: Math.max(0, THEMA_IDEEN_TAGESLIMIT - verbraucht),
  };
}

export async function incrementThemaIdeenUsage(userId: string): Promise<void> {
  const tag = heutigerTag();
  await prisma.themaIdeenUsage.upsert({
    where: { userId_tag: { userId, tag } },
    create: { userId, tag, anzahl: 1 },
    update: { anzahl: { increment: 1 } },
  });
}
