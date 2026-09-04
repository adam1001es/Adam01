import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "session_token";
const SESSION_DAUER_TAGE = 30;
// Throttle für User.letzteAktivitaet (siehe getSessionUser unten) - verhindert einen
// Schreibzugriff bei JEDER authentifizierten Anfrage in der ganzen App.
const AKTIVITAET_UPDATE_SCHWELLE_MS = 60_000;

export interface SessionUser {
  id: string;
  email: string;
  username: string | null;
  role: string;
  tier: string | null;
  tierGueltigVon: Date | null;
  tierGueltigBis: Date | null;
  avatarFarbe: string;
  avatarTextFarbe: string;
  avatarKuerzel: string | null;
  status: string;
  unterrichtsStufen: string[];
  forumGesperrt: boolean;
  letzteKontenAnsicht: Date;
  letzteCommunityAnsicht: Date;
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

// Kürzer als die E-Mail-Bestätigung: ein gültiger Passwort-Reset-Link verschafft sofort vollen
// Kontozugriff (siehe app/api/auth/passwort-zuruecksetzen), daher hier bewusst enger befristet.
const PASSWORT_RESET_GUELTIG_STUNDEN = 1;

/** Erzeugt einen neuen Passwort-Reset-Token (1h gültig) für die Reset-Mail. Eigenes Tokenfeld
 * (User.passwortResetToken) statt Wiederverwendung von erzeugeVerifizierungsToken - siehe
 * Begründung im Prisma-Schema. */
export function erzeugePasswortResetToken(): { token: string; ablauf: Date } {
  return {
    token: randomBytes(32).toString("hex"),
    ablauf: new Date(Date.now() + PASSWORT_RESET_GUELTIG_STUNDEN * 60 * 60 * 1000),
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

  // Aktualisiert User.letzteAktivitaet höchstens einmal pro Minute (nicht bei jedem Request,
  // sonst ein Schreibzugriff auf JEDE authentifizierte Anfrage in der ganzen App) - dient
  // einzig der Admin-Kontenübersicht ("wirklich online?", siehe istKuerzlichAktiv in
  // lib/status.ts), nicht dem selbst gewählten Status (User.status).
  const jetzt = new Date();
  if (
    !session.user.letzteAktivitaet ||
    jetzt.getTime() - session.user.letzteAktivitaet.getTime() > AKTIVITAET_UPDATE_SCHWELLE_MS
  ) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { letzteAktivitaet: jetzt },
    });
  }

  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    role: session.user.role,
    tier: session.user.tier,
    tierGueltigVon: session.user.tierGueltigVon,
    tierGueltigBis: session.user.tierGueltigBis,
    avatarFarbe: session.user.avatarFarbe,
    avatarTextFarbe: session.user.avatarTextFarbe,
    avatarKuerzel: session.user.avatarKuerzel,
    status: session.user.status,
    unterrichtsStufen: session.user.unterrichtsStufen,
    forumGesperrt: session.user.forumGesperrt,
    letzteKontenAnsicht: session.user.letzteKontenAnsicht,
    letzteCommunityAnsicht: session.user.letzteCommunityAnsicht,
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
