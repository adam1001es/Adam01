/** Profil-Anpassung in "Profil" (app/account) - bewusst keine freie Bild-/Emoji-Eingabe, damit im
 * Forum ein einheitliches, ruhiges Bild entsteht statt beliebiger Nutzer-Uploads. Der Avatar
 * selbst ist ein Slack/Google-artiges Buchstaben-Kürzel (siehe avatarInitialen unten) statt eines
 * Symbols - einzig wählbar ist die Hintergrundfarbe. */

export interface AvatarFarbe {
  wert: string;
  label: string;
}

/** Ein Farbton pro "Familie" der bestehenden App-Palette (siehe tailwind.config.ts) plus ein
 * paar neutrale/zusätzliche Töne - so bleibt der Avatar unterscheidbar, aber stilistisch
 * konsistent mit Übersicht/Klassen/Community statt beliebig bunt. */
export const AVATAR_FARBEN: AvatarFarbe[] = [
  { wert: "#0f766e", label: "Türkis" },
  { wert: "#0891b2", label: "Cyan" },
  { wert: "#8c6624", label: "Gold" },
  { wert: "#4f46e5", label: "Indigo" },
  { wert: "#e11d48", label: "Rosé" },
  { wert: "#d97706", label: "Bernstein" },
  { wert: "#475569", label: "Schiefer" },
  { wert: "#ffffff", label: "Weiß" },
];

export const STANDARD_AVATAR_FARBE: string = AVATAR_FARBEN[0].wert;

export function istGueltigeAvatarFarbe(wert: string): boolean {
  return AVATAR_FARBEN.some((f) => f.wert === wert);
}

/** Passende Textfarbe für das Initialen-Kürzel auf der gewählten Avatar-Hintergrundfarbe - nur
 * "Weiß" braucht dunklen statt weißen Text, alle anderen Töne der Palette sind kräftig genug. */
export function avatarTextKlasse(farbe: string): string {
  return farbe === "#ffffff" ? "text-slate-700" : "text-white";
}

// Fallback für Konten ohne gesetzten Benutzernamen (username ist optional, siehe
// User.username) - "LK" für "Lehrkraft" statt leerer/kryptischer Kürzel.
const AVATAR_INITIALEN_FALLBACK = "LK";

/** Berechnet ein Slack/Google-artiges Buchstaben-Kürzel aus dem Benutzernamen für den Avatar
 * (siehe components/AvatarForm.tsx, SiteHeader.tsx, ForumChat.tsx) - kein eigenes gespeichertes
 * Feld, wird bei jeder Anzeige live berechnet. Bei getrennt geschriebenen Namen
 * ("ahmad.yilmaz", "ahmad_yilmaz", "ahmad-yilmaz") je ein Buchstabe pro Teil ("AY"), sonst die
 * ersten zwei Buchstaben des gesamten Namens ("lehrerin82" -> "LE"). */
export function avatarInitialen(username: string | null): string {
  if (!username) return AVATAR_INITIALEN_FALLBACK;

  const teile = username.split(/[._-]+/).filter(Boolean);
  if (teile.length >= 2) {
    return (teile[0][0] + teile[1][0]).toUpperCase();
  }

  const initialen = (teile[0] ?? username).slice(0, 2).toUpperCase();
  return initialen || AVATAR_INITIALEN_FALLBACK;
}
