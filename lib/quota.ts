import { prisma } from "@/lib/prisma";

/** Abo-Stufen: Kontingent wird privat bezahlt (kein Zahlungsanbieter im Code) und von einem
 * Admin manuell zugewiesen (siehe /admin). null = kein bezahltes Abo, aber automatisch
 * KOSTENLOS_LIMIT Arbeitsblätter/Monat als Gratis-Basis (jedes Konto braucht einen Login -
 * siehe app/api/generate; zusätzlich pro IP/Browser begrenzt, siehe lib/trial.ts, damit sich
 * niemand durch mehrere Konten ein Vielfaches des Gratis-Kontingents verschafft). */
// Bemessen anhand der geschätzten KI-Kosten pro Arbeitsblatt (~0,14€ im Schnitt, siehe unten) -
// bei diesen Werten bleibt bei beiden Tarifen realistische Marge, auch wenn das Kontingent
// vollständig ausgeschöpft wird (vorher: 30/80 bei unverändertem Preis war strukturell
// defizitär, siehe Admin-Übersicht "Geschätzter Gewinn/Verlust").
export const TIER_QUOTA: Record<string, number> = {
  starter: 15,
  pro: 30,
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

/** Zusätzliches, engeres Kontingent NUR für Arbeitsblätter mit "ausmalbild"/"bildergeschichte"-
 * Aufgaben (siehe enthaeltBildAufgabe) - unabhängig vom allgemeinen TIER_QUOTA. Grund: ein
 * einzelnes bildlastiges Arbeitsblatt kostet durch die Live-Bildgenerierung (Gemini) deutlich
 * mehr als ein reines Textblatt (~0,28€ vs. ~0,10€, siehe GESCHAETZTE_KOSTEN_*). Ohne dieses
 * Extra-Limit könnte eine Lehrkraft ihr GESAMTES Kontingent mit ausschließlich bildlastigen
 * Blättern ausschöpfen und damit die Kalkulation der Tarife sprengen. Bemessen für ~15% Marge
 * selbst im Extremfall (gesamtes TIER_QUOTA bildlastig genutzt bis zu diesem Limit, Rest Text). */
export const TIER_BILD_QUOTA: Record<string, number> = {
  starter: 5,
  pro: 10,
};
export const KOSTENLOS_BILD_LIMIT = 2;

export function bildLimitFuer(tier: string | null): number {
  return tier ? TIER_BILD_QUOTA[tier] ?? 0 : KOSTENLOS_BILD_LIMIT;
}

/** Prüft, ob ein gespeichertes "contentJson" mindestens eine bildbasierte Aufgabe
 * ("ausmalbild"/"bildergeschichte") enthält - unabhängig davon, ob am Ende ein echtes
 * KI-Bild oder (bei Fehlschlag/Sicherheitsfilter) ein festes Icon verwendet wurde: der
 * kostenrelevante Punkt ist bereits der Versuch, nicht erst der Erfolg (siehe
 * TIER_BILD_QUOTA). Bewusst lose typisiert wie zaehleGenerierteBilder. */
export function enthaeltBildAufgabe(contentJson: string): boolean {
  try {
    const content = JSON.parse(contentJson) as { aufgaben?: Array<{ typ?: string }> };
    return (content.aufgaben ?? []).some(
      (a) => a.typ === "ausmalbild" || a.typ === "bildergeschichte",
    );
  } catch {
    return false;
  }
}

/** Grobe Kostenschätzung pro Arbeitsblatt (siehe Admin-Übersicht, "Geschätzte KI-Kosten") -
 * bewusst konservativ (eher zu hoch als zu niedrig geschätzt), da echte Token-Nutzung pro
 * Anfrage nicht geloggt wird. Basis: claude-opus-5 für die Erstellung + claude-sonnet-5 für die
 * Prüfung (System-Prompt gecached, 1h-TTL, Rest ungecached; typische Ausgabelänge), Gemini
 * gemini-2.5-flash-image für echte Bild-Generierungen (~0,036€/Bild). Bei Preisänderungen der
 * Anbieter, einem Modellwechsel (siehe lib/anthropic.ts) oder spürbar abweichender
 * tatsächlicher Nutzung anpassen. */
export const GESCHAETZTE_KOSTEN_TEXT_PRO_BLATT_EUR = 0.1;
export const GESCHAETZTE_KOSTEN_PRO_BILD_EUR = 0.036;

/** Zählt, wie viele Aufgaben-Bildfelder in einem gespeicherten "contentJson" tatsächlich ein
 * live per Bild-KI generiertes (und sicherheitsgeprüftes) Bild verwenden - erkennbar an
 * gesetztem "bildGeneriertId" (siehe lib/generateWorksheet.ts). Bewusst lose typisiert
 * (kein Zod-Parse) und defensiv gegen kaputte/ältere Datensätze, da dies nur für die grobe
 * Kostenschätzung in der Admin-Übersicht verwendet wird, nicht für die eigentliche Anzeige. */
export function zaehleGenerierteBilder(contentJson: string): number {
  try {
    const content = JSON.parse(contentJson) as {
      aufgaben?: Array<{
        bildGeneriertId?: string;
        bildergeschichteSchritte?: Array<{ bildGeneriertId?: string }>;
      }>;
    };
    let anzahl = 0;
    for (const aufgabe of content.aufgaben ?? []) {
      if (aufgabe.bildGeneriertId) anzahl += 1;
      for (const schritt of aufgabe.bildergeschichteSchritte ?? []) {
        if (schritt.bildGeneriertId) anzahl += 1;
      }
    }
    return anzahl;
  } catch {
    return 0;
  }
}

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
  /** Separates, engeres Kontingent nur für bildbasierte Arbeitsblätter (siehe TIER_BILD_QUOTA). */
  bildLimit: number;
  bildVerbraucht: number;
  bildVerbleibend: number;
}

/** Ist das zugewiesene "tier" gerade im (optionalen) Gültigkeitszeitraum aktiv? Ohne gesetzte
 * Grenze gilt die jeweilige Seite als offen (kein "von" = schon immer aktiv, kein "bis" =
 * unbefristet aktiv). */
export function istTierAktiv(
  tier: string | null,
  tierGueltigVon: Date | null,
  tierGueltigBis: Date | null,
  jetzt: Date = new Date(),
): boolean {
  if (!tier) return false;
  if (tierGueltigVon && jetzt < tierGueltigVon) return false;
  if (tierGueltigBis && jetzt > tierGueltigBis) return false;
  return true;
}

export async function getKontingent(user: {
  id: string;
  tier: string | null;
  tierGueltigVon?: Date | null;
  tierGueltigBis?: Date | null;
  createdAt: Date;
  role: string;
}): Promise<Kontingent> {
  const zyklusStart = aktuellerZyklusStart(user.createdAt);
  const zyklusEnde = new Date(zyklusStart.getTime() + ZYKLUS_MS);
  const [verbraucht, zyklusWorksheets] = await Promise.all([
    prisma.worksheet.count({ where: { userId: user.id, createdAt: { gte: zyklusStart } } }),
    prisma.worksheet.findMany({
      where: { userId: user.id, createdAt: { gte: zyklusStart } },
      select: { contentJson: true },
    }),
  ]);
  const bildVerbraucht = zyklusWorksheets.filter((w) => enthaeltBildAufgabe(w.contentJson)).length;

  // Außerhalb des zugewiesenen Gültigkeitszeitraums (falls gesetzt) zählt das Konto für die
  // Kontingent-Berechnung automatisch wieder als "kostenlos" - ohne dass ein Admin manuell
  // zurückstellen muss. Der rohe "tier"-Wert bleibt in der Verwaltung sichtbar, siehe
  // app/admin/page.tsx.
  const effektiverTier = istTierAktiv(
    user.tier,
    user.tierGueltigVon ?? null,
    user.tierGueltigBis ?? null,
  )
    ? user.tier
    : null;

  if (user.role === "admin") {
    return {
      tier: effektiverTier,
      limit: Infinity,
      verbraucht,
      verbleibend: Infinity,
      zyklusStart,
      zyklusEnde,
      unbegrenzt: true,
      bildLimit: Infinity,
      bildVerbraucht,
      bildVerbleibend: Infinity,
    };
  }

  const limit = effektiverTier ? TIER_QUOTA[effektiverTier] ?? 0 : KOSTENLOS_LIMIT;
  const bildLimit = bildLimitFuer(effektiverTier);
  return {
    tier: effektiverTier,
    limit,
    verbraucht,
    verbleibend: Math.max(0, limit - verbraucht),
    zyklusStart,
    zyklusEnde,
    unbegrenzt: false,
    bildLimit,
    bildVerbraucht,
    bildVerbleibend: Math.max(0, bildLimit - bildVerbraucht),
  };
}
