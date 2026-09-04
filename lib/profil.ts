/** Profil-Anpassung in "Profil" (app/account) - bewusst keine freie Bild-/Emoji-Eingabe, damit im
 * Forum ein einheitliches, ruhiges Bild entsteht statt beliebiger Nutzer-Uploads. Das Profilbild
 * selbst ist ein Slack/Google-artiges Buchstaben-Kürzel (siehe avatarInitialen unten) statt eines
 * Symbols - Hintergrund- UND Buchstabenfarbe sind unabhängig voneinander aus derselben kuratierten
 * Palette wählbar (siehe AVATAR_FARBEN). */

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
// Weiß auf dem türkisen Standard-Hintergrund (STANDARD_AVATAR_FARBE) ist gut lesbar.
export const STANDARD_AVATAR_TEXT_FARBE: string = "#ffffff";

// Hintergrund- und Buchstabenfarbe kommen bewusst aus DERSELBEN Palette (kein zweites, engeres
// "nur schwarz/weiß"-Set) - so bleibt die Wahl frei, auch wenn dadurch schlecht lesbare
// Kombinationen (z.B. Gold auf Bernstein) möglich sind; die Live-Vorschau in AvatarForm.tsx
// macht das sofort sichtbar, bevor gespeichert wird.
export function istGueltigeAvatarFarbe(wert: string): boolean {
  return AVATAR_FARBEN.some((f) => f.wert === wert);
}

// Fallback für Konten ohne gesetzten Benutzernamen (username ist optional, siehe
// User.username) - "LK" für "Lehrkraft" statt leerer/kryptischer Kürzel.
const AVATAR_INITIALEN_FALLBACK = "LK";

// 1-3 Buchstaben beliebiger Schrift (lateinisch, arabisch, ...) - \p{L} statt eines festen
// Zeichenbereichs, damit hier keine eigene Schrift-Allowlist gepflegt werden muss. Bewusst nur
// Buchstaben (keine Ziffern/Symbole/Emoji), damit das Profilbild-Kürzel visuell wie ein
// Initialen-Kürzel wirkt statt wie beliebiger Text.
const AVATAR_KUERZEL_REGEX = /^\p{L}{1,3}$/u;

export function istGueltigesAvatarKuerzel(wert: string): boolean {
  return AVATAR_KUERZEL_REGEX.test(wert);
}

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

/** Was im Profilbild-Kreis tatsächlich angezeigt wird: das manuell gesetzte Kürzel
 * (User.avatarKuerzel, siehe app/account), falls vorhanden - sonst wie bisher die automatisch aus
 * dem Benutzernamen berechneten Initialen (avatarInitialen). Erlaubt z.B. einen lateinischen
 * Login-Benutzernamen bei gleichzeitig arabischem Profilbild-Kürzel, ohne dass beides
 * zusammenhängen muss. */
export function avatarAnzeige(kuerzel: string | null, username: string | null): string {
  return kuerzel?.trim() || avatarInitialen(username);
}
