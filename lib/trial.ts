import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { KOSTENLOS_TRIAL_ANZAHL_LIMIT } from "@/lib/quota";

/**
 * Zusätzliche Absicherung des kostenlosen Gratis-Kontingents (siehe lib/quota.ts): ein Login
 * ist für jede Generierung Pflicht (app/api/generate), aber wer sich mehrere Konten anlegt,
 * würde sonst ein Vielfaches des Gratis-Kontingents bekommen. Deshalb wird die Gratis-Nutzung
 * ZUSÄTZLICH pro Browser/IP begrenzt - unabhängig davon, welches Konto gerade eingeloggt ist.
 * Zählt bewusst eine simple Arbeitsblatt-ANZAHL (KOSTENLOS_TRIAL_ANZAHL_LIMIT), nicht Punkte wie
 * das eigentliche Konto-Guthaben - ein Kosten-Tracking pro Cookie/IP wäre für diese reine
 * Zusatz-Absicherung unverhältnismäßig aufwendig. LEBENSLANG gezählt (nicht pro Monat), analog
 * zum Gratis-Kontingent selbst (siehe dortigen Kommentar) - sonst könnte man über denselben
 * Konto erneut das "einmalige" Gratis-Kontingent bekommen, was den ganzen Sinn der Umstellung
 * von "3/Monat" auf "einmalig insgesamt" untergraben würde.
 * Zwei unabhängige Zähler, jeweils der niedrigere gewinnt (blockiert also schon, wenn EINER
 * der beiden aufgebraucht ist):
 * - Cookie (Browser) - verhindert das naive "neues Konto, gleicher Browser".
 * - IP-Adresse (Server, DB-gestützt) - verhindert Cookies löschen / neues Gerät / Inkognito.
 * Kein Geräte-Fingerprinting. Bekannte Grenze: mehrere Personen im selben Schul-WLAN teilen
 * sich eine öffentliche IP und damit faktisch ein gemeinsames Gratis-Kontingent; das ist ein
 * bewusst akzeptierter Kompromiss (Reibungslosigkeit vs. Robustheit), kein Bug. Bezahlte Abos
 * (tier gesetzt) sind von dieser Zusatzsperre ausgenommen - siehe app/api/generate.
 */
const TRIAL_COOKIE = "trial_usage";
// 400 Tage statt kurzlebiger: Chrome/Firefox deckeln Cookie-Laufzeiten ohnehin bei ~400 Tagen -
// das ist der praktische Maximalwert für einen möglichst lang wirksamen "lebenslangen" Zähler
// per Cookie. Die IP-basierte DB-Sperre bleibt trotzdem die robustere der beiden Schranken.
const TRIAL_COOKIE_TAGE = 400;

/** x-forwarded-for kann eine Kette "client, proxy1, proxy2" sein - der erste Eintrag ist die
 * ursprüngliche Client-IP. Vercel setzt diesen Header zuverlässig. */
export function getClientIp(): string {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const erste = forwarded.split(",")[0]?.trim();
    if (erste) return erste;
  }
  return h.get("x-real-ip") ?? "unbekannt";
}

function getCookieCount(): number {
  const raw = cookies().get(TRIAL_COOKIE)?.value;
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Summiert ALLE bisherigen Monatszeilen für diese IP (siehe Prisma-Modell TrialUsage - weiterhin
 * pro Monat gespeichert, rein als praktische Schreib-Granularität, aber lebenslang aufsummiert
 * gelesen, siehe Kommentar oben). */
async function getIpCount(ip: string): Promise<number> {
  const ergebnis = await prisma.trialUsage.aggregate({
    where: { ip },
    _sum: { anzahl: true },
  });
  return ergebnis._sum.anzahl ?? 0;
}

export interface TrialStatus {
  verbleibend: number;
  cookieCount: number;
  ipCount: number;
}

export async function getTrialStatus(): Promise<TrialStatus> {
  const cookieCount = getCookieCount();
  const ipCount = await getIpCount(getClientIp());
  const genutzt = Math.max(cookieCount, ipCount);
  return { verbleibend: Math.max(0, KOSTENLOS_TRIAL_ANZAHL_LIMIT - genutzt), cookieCount, ipCount };
}

/** Nur aus Route Handlers aufrufbar (Server Components dürfen keine Cookies setzen). */
export async function incrementTrialUsage(): Promise<void> {
  const monat = new Date().toISOString().slice(0, 7); // "YYYY-MM" - reine Schreib-Granularität
  const ip = getClientIp();

  cookies().set(TRIAL_COOKIE, String(getCookieCount() + 1), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRIAL_COOKIE_TAGE * 24 * 60 * 60,
  });

  await prisma.trialUsage.upsert({
    where: { ip_monat: { ip, monat } },
    create: { ip, monat, anzahl: 1 },
    update: { anzahl: { increment: 1 } },
  });
}
