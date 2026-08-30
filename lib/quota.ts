import { prisma } from "@/lib/prisma";

/** Abo-Stufen: Kontingent wird privat bezahlt (kein Zahlungsanbieter im Code) und von einem
 * Admin manuell zugewiesen (siehe /admin). null = kein bezahltes Abo, aber automatisch
 * KOSTENLOS_LIMIT Arbeitsblätter/Monat als Gratis-Basis (jedes Konto braucht einen Login -
 * siehe app/api/generate; zusätzlich pro IP/Browser begrenzt, siehe lib/trial.ts, damit sich
 * niemand durch mehrere Konten ein Vielfaches des Gratis-Kontingents verschafft). */
export const TIER_QUOTA: Record<string, number> = {
  starter: 30,
  pro: 80,
};

export const TIER_PREIS_EUR: Record<string, number> = {
  starter: 3,
  pro: 6,
};

export const TIER_LABEL: Record<string, string> = {
  starter: `Starter (${TIER_PREIS_EUR.starter}€ / ${TIER_QUOTA.starter} Arbeitsblätter im Monat)`,
  pro: `Pro (${TIER_PREIS_EUR.pro}€ / ${TIER_QUOTA.pro} Arbeitsblätter im Monat)`,
};

export const KOSTENLOS_LIMIT = 3;
export const KOSTENLOS_LABEL = `Kostenlos (${KOSTENLOS_LIMIT} Arbeitsblätter im Monat)`;

export function tierLabel(tier: string | null): string {
  if (tier && TIER_LABEL[tier]) return TIER_LABEL[tier];
  return KOSTENLOS_LABEL;
}

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
  /** Admin-Konten haben kein Kontingent-Limit - siehe app/api/generate, KontingentBanner. */
  unbegrenzt: boolean;
}

export async function getKontingent(user: {
  id: string;
  tier: string | null;
  createdAt: Date;
  role: string;
}): Promise<Kontingent> {
  const zyklusStart = aktuellerZyklusStart(user.createdAt);
  const zyklusEnde = new Date(zyklusStart.getTime() + ZYKLUS_MS);
  const verbraucht = await prisma.worksheet.count({
    where: { userId: user.id, createdAt: { gte: zyklusStart } },
  });

  if (user.role === "admin") {
    return {
      tier: user.tier,
      limit: Infinity,
      verbraucht,
      verbleibend: Infinity,
      zyklusStart,
      zyklusEnde,
      unbegrenzt: true,
    };
  }

  const limit = user.tier ? TIER_QUOTA[user.tier] ?? 0 : KOSTENLOS_LIMIT;
  return {
    tier: user.tier,
    limit,
    verbraucht,
    verbleibend: Math.max(0, limit - verbraucht),
    zyklusStart,
    zyklusEnde,
    unbegrenzt: false,
  };
}
