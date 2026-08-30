import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "session_token";
const SESSION_DAUER_TAGE = 30;

export interface SessionUser {
  id: string;
  email: string;
  username: string | null;
  role: string;
  tier: string | null;
  tierGueltigVon: Date | null;
  tierGueltigBis: Date | null;
  createdAt: Date;
}

const VERIFIZIERUNG_GUELTIG_STUNDEN = 24;

/** Erzeugt einen neuen Verifizierungs-Token (24h gültig) für die Bestätigungs-Mail. */
export function erzeugeVerifizierungsToken(): { token: string; ablauf: Date } {
  return {
    token: randomBytes(32).toString("hex"),
    ablauf: new Date(Date.now() + VERIFIZIERUNG_GUELTIG_STUNDEN * 60 * 60 * 1000),
  };
}

export async function hashPassword(passwort: string): Promise<string> {
  return bcrypt.hash(passwort, 12);
}

export async function verifyPassword(passwort: string, hash: string): Promise<boolean> {
  return bcrypt.compare(passwort, hash);
}

/** Legt eine DB-gestützte Session an und setzt das httpOnly-Cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAUER_TAGE * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Liest das Session-Cookie aus, prüft es gegen die DB und gibt den eingeloggten Nutzer zurück. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    role: session.user.role,
    tier: session.user.tier,
    tierGueltigVon: session.user.tierGueltigVon,
    tierGueltigBis: session.user.tierGueltigBis,
    createdAt: session.user.createdAt,
  };
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookies().delete(SESSION_COOKIE);
}
