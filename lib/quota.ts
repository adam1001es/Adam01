import { prisma } from "@/lib/prisma";

/** Nur noch EIN bezahltes Abo (bewusst vereinfacht statt Starter/Pro-Staffelung) - Kontingent
 * wird privat bezahlt (kein Zahlungsanbieter im Code) und von einem Admin manuell zugewiesen
 * (siehe /admin, AdminTierForm bietet dafür nur noch "pro" als Paket an). null = kein bezahltes
 * Abo, aber automatisch KOSTENLOS_LIMIT Arbeitsblätter EINMALIG (nicht monatlich wiederkehrend,
 * siehe Kommentar bei KOSTENLOS_LIMIT) als Gratis-Basis zum Ausprobieren (jedes Konto braucht
 * einen Login - siehe app/api/generate; zusätzlich pro IP/Browser begrenzt, siehe lib/trial.ts,
 * damit sich niemand durch mehrere Konten ein Vielfaches des Gratis-Kontingents verschafft).
 *
 * Kalkulation (Worst Case bei voller Ausschöpfung, Ziel: mindestens ~25-30% Marge - siehe
 * GESCHAETZTE_KOSTEN_TEXT_PRO_BLATT_EUR): 11 × 0,10€ = 1,10€ Kosten bei 3,50€ Preis = 68,6% Marge
 * nach der (vermutlich zu niedrig angesetzten) Pauschalschätzung. Nach der echten, gemessenen
 * Nutzung (siehe "Ø Kosten pro Arbeitsblatt (echt)" im Admin-Bereich, lib/usageLog.ts) unbedingt
 * gegenprüfen und Preis/Kontingent bei Bedarf nachjustieren, sobald genug Datenpunkte vorliegen.
 * "starter" bleibt als Alias mit identischen Werten bestehen - reine Abwärtskompatibilität für
 * Konten, die vor dieser Umstellung noch "starter" zugewiesen bekamen (sonst würden sie beim
 * nächsten Zyklus plötzlich auf 0 Kontingent fallen); neu zuweisbar ist nur noch "pro". */
export const TIER_QUOTA: Record<string, number> = {
  starter: 11,
  pro: 11,
};

export const TIER_PREIS_EUR: Record<string, number> = {
  starter: 3.5,
  pro: 3.5,
};

/** ".toFixed(2)" allein liefert "3.50" (Punkt) statt der im Deutschen/Österreichischen üblichen
 * "3,50" (Komma) - kein Locale-Aufruf nötig für einen simplen Dezimaltrenner-Swap. */
export function formatEur(betrag: number): string {
  return betrag.toFixed(2).replace(".", ",");
}

const ABO_LABEL = `Abo (${formatEur(TIER_PREIS_EUR.pro)}€ / ${TIER_QUOTA.pro} Arbeitsblätter im Monat)`;
export const TIER_LABEL: Record<string, string> = {
  starter: ABO_LABEL,
  pro: ABO_LABEL,
};

// EINMALIG fürs ganze Konto, NICHT monatlich wiederkehrend (anders als TIER_QUOTA beim Abo) -
// bei 3/Monat dauerhaft würde die Gratis-Stufe bei wachsender Nutzerzahl zu einem unbegrenzt
// mitwachsenden Kostenblock ohne Gegenfinanzierung (siehe getKontingent: für Konten ohne
// aktives tier wird über die GESAMTE Kontolebenszeit gezählt statt nur im aktuellen Zyklus).
// Wer mehr will, braucht das bezahlte Abo - kein "jeden Monat wieder gratis".
export const KOSTENLOS_LIMIT = 4;
export const KOSTENLOS_LABEL = `Kostenlos zum Ausprobieren (${KOSTENLOS_LIMIT} Arbeitsblätter insgesamt, einmalig)`;

/** Grobe Kostenschätzung pro Arbeitsblatt (siehe Admin-Übersicht, "Geschätzte KI-Kosten") -
 * bewusst konservativ (eher zu hoch als zu niedrig geschätzt), da echte Token-Nutzung pro
 * Anfrage nicht geloggt wird. Basis: claude-opus-5 für die Erstellung + claude-sonnet-5 für die
 * Prüfung (System-Prompt gecached, 1h-TTL, Rest ungecached; typische Ausgabelänge). Live-
 * Bildgenerierung wurde entfernt (siehe zaehleGenerierteBilder) - GESCHAETZTE_KOSTEN_PRO_BILD_EUR
 * bleibt für die Kostenschätzung bereits bestehender Arbeitsblätter mit Bildern relevant. Bei
 * Preisänderungen der Anbieter, einem Modellwechsel (siehe lib/anthropic.ts) oder spürbar
 * abweichender tatsächlicher Nutzung anpassen. */
export const GESCHAETZTE_KOSTEN_TEXT_PRO_BLATT_EUR = 0.1;
export const GESCHAETZTE_KOSTEN_PRO_BILD_EUR = 0.036;

/** Zählt, wie viele Aufgaben-Bildfelder in einem gespeicherten "contentJson" tatsächlich ein
 * live per Bild-KI generiertes (und sicherheitsgeprüftes) Bild verwenden - erkennbar an
 * gesetztem "bildGeneriertId" (siehe lib/generateWorksheet.ts). Bild-Aufgaben werden nicht mehr
 * neu erzeugt, aber bestehende Arbeitsblätter können solche Felder noch enthalten (siehe
 * Admin-Übersicht, "Geschätzte KI-Kosten"). Bewusst lose typisiert (kein Zod-Parse) und defensiv
 * gegen kaputte/ältere Datensätze. */
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
  /** Für Konten ohne aktives Abo (siehe getKontingent) informativ, aber NICHT der Zeitpunkt, zu
   * dem "verbraucht"/"verbleibend" zurückgesetzt werden - das einmalige Gratis-Kontingent kennt
   * keinen Reset. Nur bei aktivem Abo markiert dieses Feld tatsächlich den nächsten Reset. */
  zyklusStart: Date;
  zyklusEnde: Date;
  /** Admin-Konten haben kein Kontingent-Limit - siehe app/api/generate, KontingentBanner. */
  unbegrenzt: boolean;
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

/** Ist dieses Konto aktuell zahlend (aktives "starter"/"pro"-Abo) oder Admin? Für Features, die
 * nur echte Kosten für zahlende Konten wert sind (aktuell: Community-Teilen, siehe
 * app/community) - bewusst leichtgewichtig (kein DB-Zugriff, nur das bereits geladene
 * SessionUser-Objekt), im Unterschied zu getKontingent, das zusätzlich das Verbrauchs-
 * Kontingent berechnet. */
export function istZahlendesKonto(user: {
  role: string;
  tier: string | null;
  tierGueltigVon?: Date | null;
  tierGueltigBis?: Date | null;
}): boolean {
  if (user.role === "admin") return true;
  return istTierAktiv(user.tier, user.tierGueltigVon ?? null, user.tierGueltigBis ?? null);
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

  // Bezahlte Konten (und Admins, rein informativ): rollierender 30-Tage-Zyklus, siehe
  // TIER_QUOTA. Kostenlose Konten OHNE aktives Abo: KOSTENLOS_LIMIT ist eine EINMALIGE
  // Gesamtsumme fürs ganze Konto (siehe Kommentar dort), daher hier über die gesamte
  // Kontolebenszeit gezählt statt nur im aktuellen Zyklus - sonst würde das "einmalige"
  // Gratis-Kontingent faktisch doch wieder jeden Zyklus neu verfügbar.
  const lebenslangZaehlen = !effektiverTier && user.role !== "admin";
  // "erstattet: false" schließt vom Admin zurückerstattete Arbeitsblätter aus (siehe
  // Prisma-Modell Worksheet.erstattet) - eine Lehrkraft bekommt ihr Kontingent für ein
  // nachweislich fehlerhaftes Arbeitsblatt zurück, ohne dass das Arbeitsblatt selbst gelöscht
  // werden muss.
  const kontingentFilter = {
    userId: user.id,
    erstattet: false,
    ...(lebenslangZaehlen ? {} : { createdAt: { gte: zyklusStart } }),
  };
  const verbraucht = await prisma.worksheet.count({ where: kontingentFilter });

  if (user.role === "admin") {
    return {
      tier: effektiverTier,
      limit: Infinity,
      verbraucht,
      verbleibend: Infinity,
      zyklusStart,
      zyklusEnde,
      unbegrenzt: true,
    };
  }

  const limit = effektiverTier ? TIER_QUOTA[effektiverTier] ?? 0 : KOSTENLOS_LIMIT;
  return {
    tier: effektiverTier,
    limit,
    verbraucht,
    verbleibend: Math.max(0, limit - verbraucht),
    zyklusStart,
    zyklusEnde,
    unbegrenzt: false,
  };
}
