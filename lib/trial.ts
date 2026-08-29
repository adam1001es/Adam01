import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { KOSTENLOS_LIMIT } from "@/lib/quota";

/**
 * Zusätzliche Absicherung des kostenlosen Gratis-Kontingents (siehe lib/quota.ts): ein Login
 * ist für jede Generierung Pflicht (app/api/generate), aber wer sich mehrere Konten anlegt,
 * würde sonst ein Vielfaches von KOSTENLOS_LIMIT bekommen. Deshalb wird die Gratis-Nutzung
 * ZUSÄTZLICH pro Browser/IP begrenzt - unabhängig davon, welches Konto gerade eingeloggt ist.
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
const TRIAL_COOKIE_TAGE = 60;

function aktuellerMonat(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

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
  const [monat, anzahlStr] = raw.split(":");
  if (monat !== aktuellerMonat()) return 0; // Cookie ist aus einem früheren Monat
  const n = parseInt(anzahlStr, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function getIpCount(ip: string): Promise<number> {
  const eintrag = await prisma.trialUsage.findUnique({
    where: { ip_monat: { ip, monat: aktuellerMonat() } },
  });
  return eintrag?.anzahl ?? 0;
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
  return { verbleibend: Math.max(0, KOSTENLOS_LIMIT - genutzt), cookieCount, ipCount };
}

/** Nur aus Route Handlers aufrufbar (Server Components dürfen keine Cookies setzen). */
export async function incrementTrialUsage(): Promise<void> {
  const monat = aktuellerMonat();
  const ip = getClientIp();

  cookies().set(TRIAL_COOKIE, `${monat}:${getCookieCount() + 1}`, {
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
