import { prisma } from "@/lib/prisma";

/** Abo-Stufen: Kontingent wird privat bezahlt (kein Zahlungsanbieter im Code) und von einem
 * Admin manuell zugewiesen (siehe /admin). null = kein aktives Abo, 0 Arbeitsblätter erlaubt. */
export const TIER_LABEL: Record<string, string> = {
  starter: "Starter (3€ / 30 Arbeitsblätter im Monat)",
  pro: "Pro (6€ / 80 Arbeitsblätter im Monat)",
};

export const TIER_QUOTA: Record<string, number> = {
  starter: 30,
  pro: 80,
};

const ZYKLUS_TAGE = 30;
const ZYKLUS_MS = ZYKLUS_TAGE * 24 * 60 * 60 * 1000;

/** Start des aktuellen 30-Tage-Zyklus, verankert am individuellen Konto-Erstellungsdatum. */
export function aktuellerZyklusStart(kontoErstelltAm: Date): Date {
  const start = kontoErstelltAm.getTime();
  const vergangeneZyklen = Math.floor((Date.now() - start) / ZYKLUS_MS);
  return new Date(start + vergangeneZyklen * ZYKLUS_MS);
}

export interface Kontingent {
  tier: string | null;
  limit: number;
  verbraucht: number;
  verbleibend: number;
  zyklusStart: Date;
  zyklusEnde: Date;
}

export async function getKontingent(user: { id: string; tier: string | null; createdAt: Date }): Promise<Kontingent> {
  const limit = user.tier ? TIER_QUOTA[user.tier] ?? 0 : 0;
  const zyklusStart = aktuellerZyklusStart(user.createdAt);
  const zyklusEnde = new Date(zyklusStart.getTime() + ZYKLUS_MS);

  const verbraucht = await prisma.worksheet.count({
    where: { userId: user.id, createdAt: { gte: zyklusStart } },
  });

  return {
    tier: user.tier,
    limit,
    verbraucht,
    verbleibend: Math.max(0, limit - verbraucht),
    zyklusStart,
    zyklusEnde,
  };
}
