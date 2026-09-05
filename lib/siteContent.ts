import { prisma } from "@/lib/prisma";

/** Steuert nur, welches Eingabefeld das Admin-Panel (app/admin/inhalte) für ein Feld zeigt -
 * "text" ein einzeiliges Input, "richtext" ein mehrzeiliges Textarea, "bild" ein Datei-Upload
 * (als data:-URL gespeichert, siehe Kommentar bei SiteContent in prisma/schema.prisma). Keine
 * harte DB-Beschränkung, nur UI-Hinweis. */
export const SITE_CONTENT_TYPEN = ["text", "richtext", "bild"] as const;
export type SiteContentTyp = (typeof SITE_CONTENT_TYPEN)[number];

/** Maximale Zeichenlänge je Typ - für "bild" die Länge der gesamten data:-URL (Base64 ist ca.
 * 1.37x die Rohgröße), daher deutlich höher als bei Text. ~2.7 Mio Zeichen entsprechen etwa 2 MB
 * Bilddatei - für admin-gepflegte Logos/Grafiken (nicht nutzergenerierte Uploads in großer Zahl)
 * ausreichend, ohne die DB mit unnötig großen Dateien zu belasten. */
export const SITE_CONTENT_MAX_LAENGE: Record<SiteContentTyp, number> = {
  text: 300,
  richtext: 2000,
  bild: 2_800_000,
};

export interface SiteContentFeld {
  key: string;
  typ: SiteContentTyp;
  /** Gruppierung im Admin-Panel (eine EinklappbareSectionCard je Seite), z.B. "Landingpage". */
  seite: string;
  /** Beschriftung des Formularfelds im Admin-Panel, z.B. "Hero-Überschrift". */
  label: string;
  /** Kurzer Kontext-Hinweis im Admin-Panel, z.B. wo genau die Stelle auf der Seite sitzt. */
  hinweis?: string;
  /** Der ursprüngliche, im Code fest hinterlegte Text/Wert - Fallback, solange kein Admin-Override
   * in der DB existiert, UND Referenzwert für den "Auf Standard zurücksetzen"-Button. Bei "bild"
   * bewusst ein leerer String (kein Default-Bild) - das Feld zeigt dann einfach nichts an, bis ein
   * Admin ein Bild hochlädt. */
  standard: string;
}

/** Zentrale Registry aller admin-editierbaren Stellen - siehe app/admin/inhalte für die
 * generierte Bearbeitungsoberfläche und die einzelnen Seiten (app/page.tsx, components/
 * LandingPage.tsx, app/faq/page.tsx, components/SiteHeader.tsx) für die Verwendung. Bewusst NICHT
 * jede Textstelle der App, sondern eine kuratierte Auswahl der Stellen, die sich in der Praxis am
 * ehesten schnell ändern sollen (Marketing-Text, Ankündigungen) - weitere Stellen lassen sich bei
 * Bedarf einfach durch einen neuen Eintrag hier + eine Codestelle, die holeSiteInhalte() abfragt,
 * ergänzen (keine Migration nötig, da SiteContent ein generisches Key-Value-Modell ist). Texte mit
 * eingebetteten dynamischen Werten (z.B. Preisen aus lib/quota.ts) sind bewusst NICHT Teil dieser
 * Registry, damit ein Admin-Override nicht versehentlich veraltete Zahlen einfriert.
 */
export const SITE_CONTENT_FELDER: SiteContentFeld[] = [
  {
    key: "landing.hero.badge",
    typ: "text",
    seite: "Landingpage",
    label: "Hero-Ankündigungs-Badge",
    hinweis: "Kleiner Hinweistext ganz oben im Hero-Bereich, z.B. für Neuigkeiten.",
    standard: "NEU: Koran direkt aus der Quelle - live abgerufen",
  },
  {
    key: "landing.hero.ueberschrift",
    typ: "text",
    seite: "Landingpage",
    label: "Hero-Überschrift",
    hinweis: "Die große Überschrift direkt unter dem Badge.",
    standard: "Dein komplettes digitales Werkzeug für den islamischen Religionsunterricht",
  },
  {
    key: "landing.hero.untertext",
    typ: "richtext",
    seite: "Landingpage",
    label: "Hero-Untertext",
    hinweis: "Der erklärende Absatz unter der Hero-Überschrift.",
    standard:
      "KI-geprüfte, lehrplanorientierte Arbeitsblätter in ca. 3 Minuten - plus Klassen-Tracking, geteilte Community-Materialien und Prüfungsgenerierung, die auch Maturaklassen ernst nimmt.",
  },
  {
    key: "landing.cta.ueberschrift",
    typ: "text",
    seite: "Landingpage",
    label: "Abschluss-CTA-Überschrift",
    hinweis: "Überschrift im letzten, farbigen Abschnitt ganz unten auf der Landingpage.",
    standard: "Das nächste Arbeitsblatt in ca. 3 Minuten statt 15",
  },
  {
    key: "dashboard.hero.ueberschrift",
    typ: "text",
    seite: "Dashboard (eingeloggt)",
    label: "Dashboard-Überschrift",
    hinweis: "Überschrift im farbigen Kopfbereich der Übersichtsseite für eingeloggte Konten.",
    standard: "Deine Arbeitsblätter",
  },
  {
    key: "dashboard.hero.untertext",
    typ: "richtext",
    seite: "Dashboard (eingeloggt)",
    label: "Dashboard-Untertext",
    hinweis: "Erklärender Text darunter.",
    standard:
      "Bereich, Thema und Schulstufe angeben – der Inhalt wird automatisch erstellt, geprüft und lehrplanorientiert aufbereitet.",
  },
  {
    key: "faq.frage.erstellung",
    typ: "text",
    seite: "Häufige Fragen",
    label: "Frage 2",
    standard: "Wie werden die Arbeitsblätter erstellt?",
  },
  {
    key: "faq.antwort.erstellung",
    typ: "richtext",
    seite: "Häufige Fragen",
    label: "Antwort 2",
    standard:
      "KI-gestützt und lehrplanorientiert, mit Zitaten/Begriffen aus einer kuratierten Wissensbasis. Ein zweiter, unabhängiger KI-Durchlauf prüft jedes Arbeitsblatt gezielt gegen, bevor es angezeigt wird.",
  },
  {
    key: "faq.frage.datenschutz",
    typ: "text",
    seite: "Häufige Fragen",
    label: "Frage 3",
    standard: "Sind Schülerdaten sicher?",
  },
  {
    key: "faq.antwort.datenschutz",
    typ: "richtext",
    seite: "Häufige Fragen",
    label: "Antwort 3",
    standard:
      "Schüler:innen werden in der Klassen-Funktion nur mit einem selbst gewählten Kürzel geführt (z.B. „Schüler 1“), nie mit echten Namen.",
  },
  {
    key: "faq.frage.community",
    typ: "text",
    seite: "Häufige Fragen",
    label: "Frage 4",
    standard: "Was ist die Community?",
  },
  {
    key: "faq.antwort.community",
    typ: "richtext",
    seite: "Häufige Fragen",
    label: "Antwort 4",
    standard:
      "Ein Bereich, in dem Lehrkräfte ihre Arbeitsblätter freiwillig teilen und die Arbeitsblätter anderer durchsuchen und verwenden können.",
  },
  {
    key: "faq.frage.pruefungen",
    typ: "text",
    seite: "Häufige Fragen",
    label: "Frage 5",
    standard: "Kann ich damit auch Prüfungen erstellen?",
  },
  {
    key: "faq.antwort.pruefungen",
    typ: "richtext",
    seite: "Häufige Fragen",
    label: "Antwort 5",
    standard:
      "Ja, auf zwei Wegen: aus bereits vorhandenen Arbeitsblättern zusammenstellen (kostet kein zusätzliches Kontingent) oder komplett neu generieren (zählt wie ein normales Arbeitsblatt zum Kontingent).",
  },
  {
    key: "design.logo.bild",
    typ: "bild",
    seite: "Design",
    label: "Logo (Kopfbereich)",
    hinweis:
      "Ersetzt das kleine Kreis-Icon links neben dem Schriftzug „Lernwerk“ im Kopfbereich jeder Seite. Ohne Upload bleibt das ursprüngliche Icon sichtbar.",
    standard: "",
  },
];

/** Lädt alle Overrides in EINER Abfrage (die Tabelle bleibt klein - eine Handvoll Zeilen) und
 * mischt sie mit den Code-Defaults aus der Registry. Rückgabe ist ein vollständiges key->Wert-Map,
 * jede registrierte Stelle hat garantiert einen Eintrag (Override oder Standard) - Aufrufer
 * brauchen also keinen eigenen Fallback (`inhalte["..."]` ist nie undefined für einen echten Key).
 */
export async function holeSiteInhalte(): Promise<Record<string, string>> {
  const eintraege = await prisma.siteContent.findMany();
  const overrides = new Map(eintraege.filter((e) => e.value !== null).map((e) => [e.key, e.value as string]));

  const ergebnis: Record<string, string> = {};
  for (const feld of SITE_CONTENT_FELDER) {
    ergebnis[feld.key] = overrides.get(feld.key) ?? feld.standard;
  }
  return ergebnis;
}
