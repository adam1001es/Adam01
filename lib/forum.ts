// Konstanten für das Lehrkräfte-Forum (siehe app/forum, app/api/forum) - Zugriffsprüfung bleibt
// direkt istZahlendesKonto (lib/quota.ts) und getSessionUser (lib/auth.ts), wie überall sonst
// auch. Einzige Ausnahme ist pruefeAufVerboteneWoerter unten, da diese Regex-Logik sonst in drei
// Routen (Thema/Antwort/Chat) identisch dupliziert werden müsste.

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

// Chat-Nachrichten sind bewusst kurzlebig (informeller Live-Austausch, kein durchsuchbares
// Archiv wie die Themen/Antworten) - ältere Nachrichten werden per "lazy cleanup" beim Laden der
// Chat-Seite bzw. beim Senden einer neuen Nachricht gelöscht (siehe app/forum/chat/page.tsx,
// app/api/forum/chat/route.ts), da es im Projekt keine Cron-/Hintergrund-Infrastruktur gibt
// (Vercel Serverless).
export const CHAT_AUFBEWAHRUNG_TAGE = 2;

/** Stichtag für die Chat-Bereinigung - Nachrichten mit createdAt davor gelten als abgelaufen
 * (siehe CHAT_AUFBEWAHRUNG_TAGE oben). */
export function chatStichtag(): Date {
  return new Date(Date.now() - CHAT_AUFBEWAHRUNG_TAGE * 24 * 60 * 60 * 1000);
}

// Einfache Wortlisten-Sperre gegen offensichtliche Schimpfwörter/Hassrede in neuen Themen,
// Antworten und Chat-Nachrichten (siehe pruefeAufVerboteneWoerter unten) - bewusst als
// ERGÄNZUNG zur Melden-Funktion/Admin-Moderation gedacht, nicht als Ersatz: eine reine
// Wortliste erkennt keinen Kontext, keine bewusste Falschschreibung ("a r s c h l o c h") und
// keine subtilere Hassrede. Liste ist bewusst kurz/erweiterbar statt erschöpfend gehalten -
// deckt eindeutige Beleidigungen/Schimpfwörter und gängige menschenverachtende Begriffe ab,
// nicht jede denkbare Formulierung.
const VERBOTENE_WOERTER = [
  "wichser",
  "hurensohn",
  "hure",
  "schlampe",
  "fotze",
  "arschloch",
  "missgeburt",
  "spast",
  "spasti",
  "hackfresse",
  "untermensch",
  "neger",
  "kanake",
];

// Wort-Grenzen (\b) statt reiner Teilstring-Suche, damit z.B. "Spastiker" (medizinischer
// Kontext) nicht durch den Treffer auf "spasti" fälschlich blockiert wird, wo eine exakte
// Wortgrenze fehlt (\b vor "spasti" selbst greift trotzdem bei "spasti," "spasti!" etc.).
const VERBOTENE_WOERTER_REGEX = new RegExp(
  `\\b(${VERBOTENE_WOERTER.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "i",
);

export const FORUM_VERBOTENER_INHALT_FEHLERTEXT =
  "Dein Beitrag enthält ein nicht erlaubtes Wort. Bitte überarbeite den Text.";

/** Prüft einen Text auf offensichtliche Schimpfwörter/Hassrede (siehe VERBOTENE_WOERTER oben). */
export function enthaeltVerbotenesWort(text: string): boolean {
  return VERBOTENE_WOERTER_REGEX.test(text);
}
