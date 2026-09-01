/** Kuratierte Auswahl für die Profil-Anpassung in "Mein Konto" (app/account) - bewusst keine
 * freie Emoji-/Farbeingabe, damit später im geplanten Forum ein einheitliches, ruhiges Bild
 * entsteht statt beliebiger Nutzer-Uploads. */

export const AVATAR_EMOJIS = [
  "🧑‍🏫",
  "👩‍🏫",
  "👨‍🏫",
  "📖",
  "🕌",
  "🌙",
  "⭐",
  "📚",
  "🎓",
  "✏️",
  "🌿",
  "🧭",
] as const;

export type AvatarEmoji = (typeof AVATAR_EMOJIS)[number];

export interface AvatarFarbe {
  wert: string;
  label: string;
}

/** Ein Farbton pro "Familie" der bestehenden App-Palette (siehe tailwind.config.ts) plus ein
 * paar neutrale/zusätzliche Töne - so bleibt der Avatar unterscheidbar, aber stilistisch
 * konsistent mit Übersicht/Klassen/Community statt beliebig bunt. */
export const AVATAR_FARBEN: AvatarFarbe[] = [
  { wert: "#0f766e", label: "Türkis" },
  { wert: "#059669", label: "Smaragd" },
  { wert: "#0891b2", label: "Cyan" },
  { wert: "#8c6624", label: "Gold" },
  { wert: "#4f46e5", label: "Indigo" },
  { wert: "#e11d48", label: "Rosé" },
  { wert: "#d97706", label: "Bernstein" },
  { wert: "#475569", label: "Schiefer" },
];

export const STANDARD_AVATAR_EMOJI: string = AVATAR_EMOJIS[0];
export const STANDARD_AVATAR_FARBE: string = AVATAR_FARBEN[0].wert;

export function istGueltigeAvatarEmoji(wert: string): boolean {
  return (AVATAR_EMOJIS as readonly string[]).includes(wert);
}

export function istGueltigeAvatarFarbe(wert: string): boolean {
  return AVATAR_FARBEN.some((f) => f.wert === wert);
}
