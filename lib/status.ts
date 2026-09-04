/** Selbst gewählter Anwesenheitsstatus (siehe User.status) - bewusst rein manuell gewählt, kein
 * automatisches Presence-/Heartbeat-System (keine solche Infrastruktur im Projekt, siehe
 * lib/prisma.ts). Als kleiner Farbpunkt am Profilbild sichtbar (siehe components/AvatarKreis.tsx,
 * verwendet in SiteHeader, ForumChat, Forum-Themen/Antworten, Profilseite). */

export const NUTZER_STATUS = ["online", "beschaeftigt", "offline"] as const;
export type NutzerStatus = (typeof NUTZER_STATUS)[number];

export const STATUS_LABEL: Record<NutzerStatus, string> = {
  online: "Online",
  beschaeftigt: "Beschäftigt",
  offline: "Offline",
};

// Bewusst unabhängig von der Avatar-Farbpalette (lib/profil.ts AVATAR_FARBEN) - eine feste,
// nicht wählbare Ampel-Logik statt einer weiteren freien Farbauswahl, damit der Status auf einen
// Blick eindeutig lesbar bleibt (grün = verfügbar, rot = beschäftigt, grau = offline/unsichtbar).
export const STATUS_FARBE: Record<NutzerStatus, string> = {
  online: "#22c55e",
  beschaeftigt: "#ef4444",
  offline: "#94a3b8",
};

export function istGueltigerStatus(wert: string): wert is NutzerStatus {
  return (NUTZER_STATUS as readonly string[]).includes(wert);
}

// Nur für die Admin-Kontenübersicht (app/admin/page.tsx) - die tatsächliche Aktivität, ganz
// unabhängig vom selbst gewählten NUTZER_STATUS oben (der bleibt für Forum/Chat/Geteilte
// Arbeitsblätter rein dekorativ). Beruht auf User.letzteAktivitaet (siehe getSessionUser in
// lib/auth.ts) statt einem echten Presence-System.
const ECHT_ONLINE_SCHWELLE_MINUTEN = 3;

export function istKuerzlichAktiv(letzteAktivitaet: Date | null): boolean {
  if (!letzteAktivitaet) return false;
  return Date.now() - letzteAktivitaet.getTime() < ECHT_ONLINE_SCHWELLE_MINUTEN * 60 * 1000;
}
