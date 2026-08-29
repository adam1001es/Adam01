import { cookies } from "next/headers";

/** Kostenlose Testversion ohne Konto: begrenzt über ein Cookie (kein Login, kein Tracking über
 * IP/Gerät) - wer Cookies löscht, bekommt ein neues Kontingent. Bewusst simpel gehalten, um
 * Lehrpersonen die Seite ohne Hürde zeigen zu können; kein Ersatz für echten Abuse-Schutz. */
export const TRIAL_LIMIT = 3;

const TRIAL_COOKIE = "trial_count";
const TRIAL_COOKIE_TAGE = 90;

export function getTrialCount(): number {
  const raw = cookies().get(TRIAL_COOKIE)?.value;
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Nur aus Route Handlers aufrufbar (Server Components dürfen keine Cookies setzen). */
export function incrementTrialCount(): void {
  cookies().set(TRIAL_COOKIE, String(getTrialCount() + 1), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRIAL_COOKIE_TAGE * 24 * 60 * 60,
  });
}
