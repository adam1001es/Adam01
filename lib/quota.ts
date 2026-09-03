import { verbrauchtePunkteFuerUser } from "@/lib/usageLog";

/** Nur noch EIN bezahltes Abo (bewusst vereinfacht statt Starter/Pro-Staffelung) - Kontingent
 * wird privat bezahlt (kein Zahlungsanbieter im Code) und von einem Admin manuell zugewiesen
 * (siehe /admin, AdminTierForm bietet dafür nur noch "pro" als Paket an). null = kein bezahltes
 * Abo, aber automatisch KOSTENLOS_PUNKTE_LIMIT Punkte EINMALIG (nicht monatlich wiederkehrend,
 * siehe Kommentar bei KOSTENLOS_PUNKTE_LIMIT) als Gratis-Basis zum Ausprobieren (jedes Konto
 * braucht einen Login - siehe app/api/generate; zusätzlich pro IP/Browser begrenzt, siehe
 * lib/trial.ts, damit sich niemand durch mehrere Konten ein Vielfaches des Gratis-Kontingents
 * verschafft).
 *
 * Punkte-/Guthaben-System statt einer festen Arbeitsblatt-Zählung: 1 Punkt = 1 Cent TATSÄCHLICH
 * gemessene Kosten (siehe berechneKostenEur in lib/pricing.ts, verbrauchtePunkteFuerUser in
 * lib/usageLog.ts) - der Grund für die Umstellung ist, dass ein einzelnes Arbeitsblatt je nach
 * Themenumfang/Aufgabenanzahl SEHR unterschiedlich viel kostet (gemessen: Ø ca. 25 Cent, einzelne
 * umfangreiche Blätter auch 40-60 Cent) - eine feste "X Arbeitsblätter"-Zählung ignoriert das
 * komplett und kann bei einem Konto mit durchgehend teuren Blättern sogar zum Verlust führen.
 *
 * Kalkulation (Worst Case bei voller Ausschöpfung): 300 Punkte × 0,01€ = 3,00€ Kosten bei 3,50€
 * Preis = mindestens 14,3% Marge - GARANTIERT statt geschätzt, weil die Punkte selbst direkt an
 * echte Kosten gekoppelt sind (im Unterschied zur früheren Pauschalschätzung, die sich im
 * Nachhinein als zu niedrig herausstellte - echter Ø-Wert ca. 25 Cent statt der angenommenen 10
 * Cent). "starter" bleibt als Alias mit identischen Werten bestehen - reine Abwärtskompatibilität
 * für Konten, die vor der Ein-Tarif-Umstellung noch "starter" zugewiesen bekamen; neu zuweisbar
 * ist nur noch "pro". */
export const TIER_PUNKTE_QUOTA: Record<string, number> = {
  starter: 300,
  pro: 300,
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

// Für die "ca. X-Y Arbeitsblätter"-Anzeige (siehe schaetzeArbeitsblaetterSpanne) - bewusst NICHT
// der echte gemessene Durchschnitt (aktuell ca. 25 Punkte/Blatt), sondern ein etwas teurerer
// Realitäts-Korridor: er berücksichtigt, dass einzelne aufwendigere Arbeitsblätter (bis ca. 60
// Punkte) den Schnitt einer Lehrkraft nach oben ziehen können, ohne die seltenen Extremfälle
// selbst als Untergrenze zu nehmen (das würde die Spanne unnötig breit und wenig aussagekräftig
// machen). Nur für die Anzeige relevant, NICHT für die tatsächliche Punkte-Abrechnung selbst -
// die basiert immer auf echten, gemessenen Kosten pro Generierung.
const SPANNE_PUNKTE_PRO_BLATT_GUENSTIG = 27;
const SPANNE_PUNKTE_PRO_BLATT_TEUER = 37;

/** Grobe "ca. X-Y Arbeitsblätter"-Schätzung aus einer Punktezahl - für Guthaben-Anzeigen, die
 * sich nicht nur abstrakt anfühlen sollen (siehe KontingentBanner, LandingPage). */
export function schaetzeArbeitsblaetterSpanne(punkte: number): { von: number; bis: number } {
  if (punkte <= 0) return { von: 0, bis: 0 };
  return {
    von: Math.floor(punkte / SPANNE_PUNKTE_PRO_BLATT_TEUER),
    bis: Math.floor(punkte / SPANNE_PUNKTE_PRO_BLATT_GUENSTIG),
  };
}

/** "ca. 8-11 Arbeitsblätter" bzw. "ca. 8 Arbeitsblätter", falls die Spanne bei kleinen
 * Punktezahlen (z.B. das Gratis-Kontingent) auf einen einzelnen Wert zusammenfällt. */
export function formatArbeitsblaetterSpanne(punkte: number): string {
  const { von, bis } = schaetzeArbeitsblaetterSpanne(punkte);
  return von === bis ? `ca. ${von} Arbeitsblätter` : `ca. ${von}-${bis} Arbeitsblätter`;
}

const ABO_LABEL = `Abo (${formatEur(TIER_PREIS_EUR.pro)}€ / ${TIER_PUNKTE_QUOTA.pro} Punkte im Monat, ${formatArbeitsblaetterSpanne(TIER_PUNKTE_QUOTA.pro)})`;
export const TIER_LABEL: Record<string, string> = {
  starter: ABO_LABEL,
  pro: ABO_LABEL,
};

// EINMALIG fürs ganze Konto, NICHT monatlich wiederkehrend (anders als TIER_PUNKTE_QUOTA beim
// Abo) - bei einem wiederkehrenden Gratis-Kontingent würde die Gratis-Stufe bei wachsender
// Nutzerzahl zu einem unbegrenzt mitwachsenden Kostenblock ohne Gegenfinanzierung (siehe
// getKontingent: für Konten ohne aktives tier wird über die GESAMTE Kontolebenszeit gezählt statt
// nur im aktuellen Zyklus). Wer mehr will, braucht das bezahlte Abo - kein "jeden Monat wieder
// gratis". 100 Punkte entsprechen bei echten Kosten in etwa den früheren "4 Arbeitsblätter".
export const KOSTENLOS_PUNKTE_LIMIT = 100;
export const KOSTENLOS_LABEL = `Kostenlos zum Ausprobieren (${KOSTENLOS_PUNKTE_LIMIT} Punkte insgesamt, einmalig, ${formatArbeitsblaetterSpanne(KOSTENLOS_PUNKTE_LIMIT)})`;

// Eigenständige, bewusst NICHT punktebasierte Obergrenze für die Browser-/IP-Sperre (siehe
// lib/trial.ts) - die verhindert nur, dass sich jemand mehrere Konten anlegt, um ein Vielfaches
// des Gratis-Kontingents zu bekommen, und zählt dafür bewusst eine simple Anzahl erstellter
// Arbeitsblätter statt echter Kosten (ein Kosten-Tracking pro Cookie/IP wäre unverhältnismäßig
// aufwendig für eine reine Zusatz-Absicherung). 4 war schon vor der Punkte-Umstellung der Wert
// und bleibt es - passt weiterhin gut zur unteren Grenze dessen, was KOSTENLOS_PUNKTE_LIMIT an
// Arbeitsblättern hergibt (siehe formatArbeitsblaetterSpanne(KOSTENLOS_PUNKTE_LIMIT)).
export const KOSTENLOS_TRIAL_ANZAHL_LIMIT = 4;

/** Grobe Kostenschätzung pro Arbeitsblatt NUR NOCH für die "Geschätzte KI-Kosten"-Zeile im
 * Admin-Bereich (app/admin/kosten) - ein schneller Blick auf laufende Monatskosten, falls (noch)
 * keine/wenige echte UsageLog-Daten vorliegen. Das eigentliche Guthaben-System (siehe
 * TIER_PUNKTE_QUOTA) nutzt dagegen immer echte, gemessene Kosten. War ursprünglich mit 0,10€
 * angesetzt (grobe Annahme ohne echte Daten) - nach genug echten Datenpunkten auf den tatsächlich
 * gemessenen Ø-Wert (siehe "Ø Kosten pro Arbeitsblatt (echt)") korrigiert. Live-Bildgenerierung
 * wurde entfernt (siehe zaehleGenerierteBilder) - GESCHAETZTE_KOSTEN_PRO_BILD_EUR bleibt für die
 * Kostenschätzung bereits bestehender Arbeitsblätter mit Bildern relevant. Bei Preisänderungen
 * der Anbieter, einem Modellwechsel (siehe lib/anthropic.ts) oder spürbar abweichender
 * tatsächlicher Nutzung erneut anpassen. */
export const GESCHAETZTE_KOSTEN_TEXT_PRO_BLATT_EUR = 0.25;
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
  /** Alle drei Felder in PUNKTEN (1 Punkt = 1 Cent echte Kosten), nicht in Arbeitsblatt-Stück -
   * siehe schaetzeArbeitsblaetterSpanne für eine grobe Umrechnung in Arbeitsblätter für die
   * Anzeige. */
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
  // TIER_PUNKTE_QUOTA. Kostenlose Konten OHNE aktives Abo: KOSTENLOS_PUNKTE_LIMIT ist eine
  // EINMALIGE Gesamtsumme fürs ganze Konto (siehe Kommentar dort), daher hier über die gesamte
  // Kontolebenszeit gezählt statt nur im aktuellen Zyklus - sonst würde das "einmalige"
  // Gratis-Kontingent faktisch doch wieder jeden Zyklus neu verfügbar.
  const lebenslangZaehlen = !effektiverTier && user.role !== "admin";
  // Punkte statt Arbeitsblatt-Zählung (siehe verbrauchtePunkteFuerUser in lib/usageLog.ts) -
  // schließt erstattete Arbeitsblätter (Worksheet.erstattet) bereits selbst aus: eine Lehrkraft
  // bekommt ihr Guthaben für ein nachweislich fehlerhaftes Arbeitsblatt zurück, ohne dass das
  // Arbeitsblatt selbst gelöscht werden muss.
  const verbraucht = await verbrauchtePunkteFuerUser(
    user.id,
    lebenslangZaehlen ? undefined : zyklusStart,
  );

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

  const limit = effektiverTier ? TIER_PUNKTE_QUOTA[effektiverTier] ?? 0 : KOSTENLOS_PUNKTE_LIMIT;
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
