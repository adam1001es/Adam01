// Konstanten für das Lehrkräfte-Forum (siehe app/forum, app/api/forum) - bewusst nur Werte,
// keine Helper-Funktionen: Zugriffsprüfung bleibt direkt istZahlendesKonto (lib/quota.ts) und
// getSessionUser (lib/auth.ts), wie überall sonst auch.

export const FORUM_KATEGORIEN = [
  "erfahrungsaustausch",
  "unterrichtsmethoden",
  "aktuelles_gesellschaft",
  "arbeitsblaetter_material",
  "sonstiges",
] as const;
export type ForumKategorie = (typeof FORUM_KATEGORIEN)[number];

export const FORUM_KATEGORIE_LABEL: Record<ForumKategorie, string> = {
  erfahrungsaustausch: "Erfahrungsaustausch",
  unterrichtsmethoden: "Unterrichtsmethoden",
  aktuelles_gesellschaft: "Aktuelles & Gesellschaft",
  arbeitsblaetter_material: "Arbeitsblätter & Material",
  sonstiges: "Sonstiges",
};

export const FORUM_MELDUNG_ZIEL_TYPEN = ["thread", "antwort", "chat"] as const;
export type ForumMeldungZielTyp = (typeof FORUM_MELDUNG_ZIEL_TYPEN)[number];

export const FORUM_TITEL_MAX_LAENGE = 150;
export const FORUM_INHALT_MAX_LAENGE = 5000;
export const FORUM_CHAT_MAX_LAENGE = 1000;
export const FORUM_MELDUNG_GRUND_MAX_LAENGE = 500;

export const FORUM_GESPERRT_FEHLERTEXT = "Dein Konto ist derzeit für das Forum gesperrt.";
