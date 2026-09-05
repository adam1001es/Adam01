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
  // Die vier statischen Info-Seiten unten (Pädagogischer Ansatz/Schulstufen/Über Lernwerk/
  // Datenschutz) sowie Impressum: pro Abschnitt Überschrift + Fließtext, wo vorhanden. Absätze mit
  // eingebettetem Link (z.B. Verweis auf eine andere Seite oder ein mailto:-Link) sind bewusst
  // NICHT Teil der Registry - als reiner Text überschrieben würde der Link verloren gehen (siehe
  // app/paedagogik, app/ueber-uns, app/impressum, app/datenschutz für die jeweils
  // ausgesparten Absätze).
  {
    key: "paedagogik.lehrplan.titel",
    typ: "text",
    seite: "Pädagogischer Ansatz",
    label: "Abschnitt 1 - Überschrift",
    standard: "Lehrplanverankerung",
  },
  {
    key: "paedagogik.lehrplan.text",
    typ: "richtext",
    seite: "Pädagogischer Ansatz",
    label: "Abschnitt 1 - Text",
    standard:
      "Inhalte orientieren sich am aktuellen Lehrplan für den islamischen Religionsunterricht an österreichischen Schulen und dessen Grundkompetenzen - kein freies Erfinden von Themen, sondern eine Zuordnung zu tatsächlich vorgesehenen Kompetenzbereichen.",
  },
  {
    key: "paedagogik.pruefung.titel",
    typ: "text",
    seite: "Pädagogischer Ansatz",
    label: "Abschnitt 2 - Überschrift",
    standard: "Zweifache Prüfung",
  },
  {
    key: "paedagogik.pruefung.text",
    typ: "richtext",
    seite: "Pädagogischer Ansatz",
    label: "Abschnitt 2 - Text",
    standard:
      "Jedes Arbeitsblatt wird in einem zweiten, unabhängigen Durchlauf gezielt gegengeprüft - auf Quellenangaben, Vollständigkeit, Altersgerechtigkeit und Kompetenzorientierung - bevor es angezeigt wird.",
  },
  {
    key: "paedagogik.wissensbasis.titel",
    typ: "text",
    seite: "Pädagogischer Ansatz",
    label: "Abschnitt 3 - Überschrift",
    standard: "Wissensbasis statt freiem Erfinden",
  },
  {
    key: "paedagogik.wissensbasis.text",
    typ: "richtext",
    seite: "Pädagogischer Ansatz",
    label: "Abschnitt 3 - Text",
    standard:
      "Zitate (z.B. aus Koran und Hadith) und Fachbegriffe stammen aus einer kuratierten, von uns geprüften Wissensbasis statt aus dem freien Erinnern der KI - jede Quelle ist damit nachvollziehbar.",
  },
  {
    key: "schulstufen.intro",
    typ: "richtext",
    seite: "Schulstufen",
    label: "Einleitung",
    standard:
      "Lernwerk deckt alle Schulstufen des islamischen Religionsunterrichts an österreichischen Schulen ab - von der 1. Klasse Volksschule bis zur Matura. Inhalte, Aufgabentypen und Anforderungsniveau passen sich dabei automatisch der gewählten Schulstufe an.",
  },
  {
    key: "schulstufen.volksschule.titel",
    typ: "text",
    seite: "Schulstufen",
    label: "Volksschule - Überschrift",
    standard: "Volksschule (1.-4. Klasse)",
  },
  {
    key: "schulstufen.volksschule.text",
    typ: "richtext",
    seite: "Schulstufen",
    label: "Volksschule - Text",
    standard:
      "Spielerischer Zugang mit Mal- und Bewegungsaufgaben, kurzen Texten und Rücksicht auf noch ungeübte Leser:innen (z.B. Hinweise zum Vorlesen statt reiner Lesetexte).",
  },
  {
    key: "schulstufen.sek1.titel",
    typ: "text",
    seite: "Schulstufen",
    label: "Sekundarstufe 1 - Überschrift",
    standard: "Sekundarstufe 1 (Mittelschule/AHS-Unterstufe, 5.-8. Schulstufe)",
  },
  {
    key: "schulstufen.sek1.text",
    typ: "richtext",
    seite: "Schulstufen",
    label: "Sekundarstufe 1 - Text",
    standard:
      "Breitere Mischung an Aufgabentypen (u.a. Multiple Choice, Lückentext, Zuordnung, offene Fragen) zur Vertiefung des Grundwissens.",
  },
  {
    key: "schulstufen.sek2.titel",
    typ: "text",
    seite: "Schulstufen",
    label: "Sekundarstufe 2 - Überschrift",
    standard: "Sekundarstufe 2 (Polytechnische Schule, AHS-Oberstufe/BMHS, Berufsschule)",
  },
  {
    key: "schulstufen.sek2.text",
    typ: "richtext",
    seite: "Schulstufen",
    label: "Sekundarstufe 2 - Text",
    standard:
      "Anspruchsvollere Aufgabenstellungen mit stärkerer Gewichtung höherer Anforderungsbereiche - hier lassen sich auch echte Prüfungen inklusive Punktevergabe zusammenstellen oder generieren, gezielt auch für Maturaklassen.",
  },
  {
    key: "schulstufen.berufsschule.titel",
    typ: "text",
    seite: "Schulstufen",
    label: "Berufsschule - Überschrift",
    standard: "Berufsschule",
  },
  {
    key: "schulstufen.berufsschule.text",
    typ: "richtext",
    seite: "Schulstufen",
    label: "Berufsschule - Text",
    standard: "Eigene, an den Berufsschul-Kontext angepasste Themenvorschläge.",
  },
  {
    key: "ueberuns.absatz1",
    typ: "richtext",
    seite: "Über Lernwerk",
    label: "Absatz 1",
    standard:
      "Lernwerk ist für Lehrkräfte des islamischen Religionsunterrichts an österreichischen Schulen entstanden: Statt jedes Arbeitsblatt von Grund auf selbst zu recherchieren und zu gestalten, entsteht es hier lehrplanorientiert, mit belegten Quellen und einer eigenständigen Qualitätsprüfung - in wenigen Minuten statt Stunden.",
  },
  {
    key: "ueberuns.absatz3",
    typ: "richtext",
    seite: "Über Lernwerk",
    label: "Absatz 3",
    standard:
      "Neben dem Erstellen einzelner Arbeitsblätter unterstützt Lernwerk auch die Klassenverwaltung (anonymisiert, ohne echte Schülernamen), das Zusammenstellen und Generieren von Prüfungen sowie eine Community, in der Lehrkräfte Arbeitsblätter untereinander teilen können.",
  },
  {
    key: "impressum.adresse",
    typ: "richtext",
    seite: "Impressum",
    label: "Name & Anschrift",
    hinweis: "Jede Zeile wird einzeln dargestellt (Zeilenumbrüche bleiben erhalten).",
    standard: "Dua Zentrum\nBeethovenplatz 1 (Ecke Lothringerstraße)\n1010 Wien\nÖsterreich\nVertreten durch: Adam Es",
  },
  {
    key: "impressum.email",
    typ: "text",
    seite: "Impressum",
    label: "Kontakt-E-Mail",
    standard: "magdykasim30008000@gmail.com",
  },
  {
    key: "datenschutz.kontoNutzung",
    typ: "richtext",
    seite: "Datenschutz",
    label: "Konto & Nutzung",
    standard:
      "Bei der Registrierung verarbeiten wir E-Mail-Adresse und Passwort (verschlüsselt gespeichert), zur Anmeldung ein technisch notwendiges Session-Cookie. Grundlage ist die Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO). Schüler:innen werden in der Klassen-Funktion ausschließlich mit einem selbst gewählten Kürzel geführt, nie mit echten Namen.",
  },
  {
    key: "datenschutz.empfaenger",
    typ: "richtext",
    seite: "Datenschutz",
    label: "Empfänger",
    standard:
      "Zur Erbringung des Dienstes setzen wir folgende Auftragsverarbeiter ein: Anthropic (USA) zur Erstellung der Arbeitsblatt-Inhalte, Google/Gmail zum Versand von System-E-Mails (z.B. Bestätigungslink), Sentry zur technischen Fehlererfassung (ohne Bildschirmaufzeichnung).",
  },
  {
    key: "datenschutz.speicherdauer",
    typ: "text",
    seite: "Datenschutz",
    label: "Speicherdauer",
    standard: "Kontodaten werden bis zur Löschung des Kontos gespeichert.",
  },
  {
    key: "datenschutz.rechte",
    typ: "richtext",
    seite: "Datenschutz",
    label: "Ihre Rechte",
    standard:
      "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch (Art. 15-21 DSGVO) - Anfragen an obige Kontakt-E-Mail. Außerdem besteht ein Beschwerderecht bei der österreichischen Datenschutzbehörde (dsb.gv.at).",
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
