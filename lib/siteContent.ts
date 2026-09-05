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
    seite: "Landingpage: Hero",
    label: "Ankündigungs-Badge",
    hinweis: "Kleiner Hinweistext ganz oben im Hero-Bereich, z.B. für Neuigkeiten.",
    standard: "NEU: Koran direkt aus der Quelle - live abgerufen",
  },
  {
    key: "landing.hero.ueberschrift",
    typ: "text",
    seite: "Landingpage: Hero",
    label: "Überschrift",
    hinweis: "Die große Überschrift direkt unter dem Badge.",
    standard: "Dein komplettes digitales Werkzeug für den islamischen Religionsunterricht",
  },
  {
    key: "landing.hero.untertext",
    typ: "richtext",
    seite: "Landingpage: Hero",
    label: "Untertext",
    hinweis: "Der erklärende Absatz unter der Hero-Überschrift.",
    standard:
      "Lehrplanorientierte Arbeitsblätter in ca. 3 Minuten fertig - automatisch erstellt und sorgfältig gegengeprüft, du behältst dabei immer das letzte Wort. Dazu: Überblick über deine Klassen, Materialien von Kolleg:innen und Prüfungen, die auch der Matura gerecht werden.",
  },
  {
    key: "landing.hero.hinweis",
    typ: "text",
    seite: "Landingpage: Hero",
    label: "Kleiner Hinweis unter den Buttons",
    standard: "Nur E-Mail + Passwort - in wenigen Minuten startklar.",
  },
  {
    key: "landing.hero.anmeldenButton",
    typ: "text",
    seite: "Landingpage: Hero",
    label: "Button „Anmelden“",
    standard: "Anmelden",
  },
  {
    key: "landing.hero.badgeGeprueft",
    typ: "text",
    seite: "Landingpage: Hero",
    label: "Kleines Schild an der Vorschau: „Zweifach geprüft“",
    standard: "Zweifach geprüft",
  },
  {
    key: "landing.hero.badgeSchnell",
    typ: "text",
    seite: "Landingpage: Hero",
    label: "Kleines Schild an der Vorschau: „In ca. 3 Minuten fertig“",
    standard: "In ca. 3 Minuten fertig",
  },
  {
    key: "landing.pfeiler.1.titel",
    typ: "text",
    seite: "Landingpage: Vier Bereiche",
    label: "Kachel 1 - Überschrift",
    standard: "Arbeitsblätter",
  },
  {
    key: "landing.pfeiler.1.text",
    typ: "richtext",
    seite: "Landingpage: Vier Bereiche",
    label: "Kachel 1 - Text",
    standard: "In ca. 3 Minuten fertig, zweifach geprüft, direkt druckbereit.",
  },
  {
    key: "landing.pfeiler.2.titel",
    typ: "text",
    seite: "Landingpage: Vier Bereiche",
    label: "Kachel 2 - Überschrift",
    standard: "Klassen & Prüfungen",
  },
  {
    key: "landing.pfeiler.2.text",
    typ: "richtext",
    seite: "Landingpage: Vier Bereiche",
    label: "Kachel 2 - Text",
    standard: "Wissensstand pro Klasse und Schüler:in auf einen Blick.",
  },
  {
    key: "landing.pfeiler.3.titel",
    typ: "text",
    seite: "Landingpage: Vier Bereiche",
    label: "Kachel 3 - Überschrift",
    standard: "Community",
  },
  {
    key: "landing.pfeiler.3.text",
    typ: "richtext",
    seite: "Landingpage: Vier Bereiche",
    label: "Kachel 3 - Text",
    standard: "Bewährte Arbeitsblätter von Kolleg:innen entdecken.",
  },
  {
    key: "landing.pfeiler.4.titel",
    typ: "text",
    seite: "Landingpage: Vier Bereiche",
    label: "Kachel 4 - Überschrift",
    standard: "Direkt aus dem Koran",
  },
  {
    key: "landing.pfeiler.4.text",
    typ: "richtext",
    seite: "Landingpage: Vier Bereiche",
    label: "Kachel 4 - Text",
    standard: "Vers/Sure live abgerufen - garantiert korrekt zitiert.",
  },
  {
    key: "landing.arbeitsblaetter.titel",
    typ: "text",
    seite: "Landingpage: Arbeitsblätter",
    label: "Abschnitt-Überschrift",
    standard: "Was jedes Arbeitsblatt automatisch mitbringt",
  },
  {
    key: "landing.arbeitsblaetter.untertitel",
    typ: "richtext",
    seite: "Landingpage: Arbeitsblätter",
    label: "Abschnitt-Untertitel",
    standard: "Kein Nachjustieren nötig - das steckt in jedem einzelnen Blatt, ohne dass du extra danach fragen musst.",
  },
  {
    key: "landing.feature.1.titel",
    typ: "text",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 1 - Überschrift",
    standard: "Zweite, unabhängige Prüfung",
  },
  {
    key: "landing.feature.1.text",
    typ: "richtext",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 1 - Text",
    standard:
      "Jedes Arbeitsblatt wird nach der Erstellung in einem zweiten, unabhängigen Schritt noch einmal genau gegengeprüft - auf Quellenangaben, Vollständigkeit, Altersgerechtigkeit und pädagogischen Aufbau. Die letzte Kontrolle liegt trotzdem bei dir.",
  },
  {
    key: "landing.feature.2.titel",
    typ: "text",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 2 - Überschrift",
    standard: "Pädagogisch fundiert",
  },
  {
    key: "landing.feature.2.text",
    typ: "richtext",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 2 - Text",
    standard:
      "Anforderungsbereiche (AFB I-III), anerkannte Kompetenzbereiche und kompetenzorientierte Lernziele sind fest eingebaut - bei jedem Arbeitsblatt, nicht nur wenn man daran denkt, es zu verlangen.",
  },
  {
    key: "landing.feature.3.titel",
    typ: "text",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 3 - Überschrift",
    standard: "Für den österreichischen IGGÖ-Lehrplan",
  },
  {
    key: "landing.feature.3.text",
    typ: "richtext",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 3 - Text",
    standard:
      "Orientiert an der Grobstruktur des aktuellen Lehrplans für islamischen Religionsunterricht der IGGÖ („Lehrplan IRU NEU“) - Themenbereich und Schulstufen-Cluster fließen direkt in Sprache und Inhalt ein.",
  },
  {
    key: "landing.feature.4.titel",
    typ: "text",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 4 - Überschrift",
    standard: "Direkt druckfertig",
  },
  {
    key: "landing.feature.4.text",
    typ: "richtext",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 4 - Text",
    standard:
      "Kein Fließtext, den du erst noch in Form bringen musst: ein fertiges PDF oder Word-Dokument zum sofortigen Ausdrucken - auf Wunsch mit islamischem Datum und einem dezenten Ornament-Muster.",
  },
  {
    key: "landing.feature.5.titel",
    typ: "text",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 5 - Überschrift",
    standard: "Kontrollierte Quellendisziplin",
  },
  {
    key: "landing.feature.5.text",
    typ: "richtext",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 5 - Text",
    standard:
      "Hadith-Angaben stammen bevorzugt aus den anerkannten Sammlungen Sahih al-Bukhari und Muslim. Ist sich das System bei einer Angabe nicht sicher, steht deutlich „bitte prüfen“ dabei - nichts wird einfach erfunden.",
  },
  {
    key: "landing.feature.6.titel",
    typ: "text",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 6 - Überschrift",
    standard: "Altersgerecht für die 1. Klasse",
  },
  {
    key: "landing.feature.6.text",
    typ: "richtext",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 6 - Text",
    standard:
      "Für noch nicht lese-/schreibkundige Kinder vier eigene Aufgabentypen: Bewegungsaufgabe (körperlich reagieren statt lesen), Sortierkarten (ausschneiden & einordnen), Malaufgabe (selbst zeichnen) und Nachspurübung (Schreibmotorik).",
  },
  {
    key: "landing.feature.7.titel",
    typ: "text",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 7 - Überschrift",
    standard: "Recherche- und Referatsaufträge",
  },
  {
    key: "landing.feature.7.text",
    typ: "richtext",
    seite: "Landingpage: Arbeitsblätter",
    label: "Feature 7 - Text",
    standard:
      "Ab der Sekundarstufe I: eigenständige Recherche-/Präsentationsaufgaben zu Personen, Orten oder Themen - mit Leitfaden, Bewertungskriterien und Quellenhinweis statt vager Freitext-Anweisung.",
  },
  {
    key: "landing.koran.badge",
    typ: "text",
    seite: "Landingpage: Koran",
    label: "Badge",
    standard: "Koran als eigenständige Aufgabe",
  },
  {
    key: "landing.koran.titel",
    typ: "text",
    seite: "Landingpage: Koran",
    label: "Überschrift",
    standard: "Sure oder Vers gezielt auswählen - live und garantiert korrekt zitiert",
  },
  {
    key: "landing.koran.text",
    typ: "richtext",
    seite: "Landingpage: Koran",
    label: "Absatz",
    standard:
      "Der Koran-Text wird nicht aus der Erinnerung nachgebildet, sondern direkt aus einer Koran-Datenbank geholt (Arabisch + deutsche Übersetzung von Bubenheim & Elyas). Zwei Wege stehen zur Wahl: nur der reine Text zum Ausdrucken - ganz ohne dein Guthaben zu belasten - oder ein vollständiges Arbeitsblatt mit Methoden und Aufgaben rund um den Vers.",
  },
  {
    key: "landing.koran.punkt.1",
    typ: "text",
    seite: "Landingpage: Koran",
    label: "Stichpunkt 1",
    standard: "Ganze Sure oder ein bestimmter Versbereich",
  },
  {
    key: "landing.koran.punkt.2",
    typ: "text",
    seite: "Landingpage: Koran",
    label: "Stichpunkt 2",
    standard: "Original-Arabisch + deutsche Übersetzung, rechtsläufig korrekt gesetzt",
  },
  {
    key: "landing.koran.punkt.3",
    typ: "text",
    seite: "Landingpage: Koran",
    label: "Stichpunkt 3",
    standard: "„Nur Text“-Option: verbraucht kein Guthaben",
  },
  {
    key: "landing.badge.enthaltenImAbo",
    typ: "text",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Badge „Enthalten im Abo“",
    hinweis: "Wird sowohl im Klassen- als auch im Community-Abschnitt verwendet.",
    standard: "Enthalten im Abo",
  },
  {
    key: "landing.klassen.titel",
    typ: "text",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Überschrift",
    standard:
      "Klassen, Wissensstand und Prüfungen - der Teil, der aus einem Generator ein echtes Unterrichtswerkzeug macht",
  },
  {
    key: "landing.klassen.untertitel",
    typ: "richtext",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Untertitel",
    standard:
      "Besonders gedacht auch für Lehrkräfte, die Maturaklassen betreuen und echte Wissensfeststellung brauchen, nicht nur Übungsblätter.",
  },
  {
    key: "landing.klassenpunkt.1.titel",
    typ: "text",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 1 - Überschrift",
    standard: "Klassen & pseudonyme Schüler-Kürzel",
  },
  {
    key: "landing.klassenpunkt.1.text",
    typ: "richtext",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 1 - Text",
    standard:
      "Klassen anlegen, Schüler:innen nur mit Kürzel führen (z.B. „Schüler 1“) - bewusst ohne echte Namen, damit Datenschutz kein Thema ist.",
  },
  {
    key: "landing.klassenpunkt.2.titel",
    typ: "text",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 2 - Überschrift",
    standard: "Zuweisungen erfassen",
  },
  {
    key: "landing.klassenpunkt.2.text",
    typ: "richtext",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 2 - Text",
    standard:
      "Welches Arbeitsblatt oder welche Prüfung hat welche Klasse wann bekommen - eigene Blätter, geteilte Community-Blätter oder manuell erfasste externe Materialien.",
  },
  {
    key: "landing.klassenpunkt.3.titel",
    typ: "text",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 3 - Überschrift",
    standard: "Wissensstand automatisch berechnet",
  },
  {
    key: "landing.klassenpunkt.3.text",
    typ: "richtext",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 3 - Text",
    standard:
      "Klassendurchschnitt, Abdeckung nach Grundkompetenz und Entwicklung pro Schüler:in - inklusive Noten-Richtwert nach gängigem österreichischem Schlüssel.",
  },
  {
    key: "landing.klassenpunkt.4.titel",
    typ: "text",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 4 - Überschrift",
    standard: "Klassenzimmer-Ansicht",
  },
  {
    key: "landing.klassenpunkt.4.text",
    typ: "richtext",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 4 - Text",
    standard:
      "Tafel und Schülertische von oben, jeder Tisch farbcodiert nach Notendurchschnitt - Klick auf einen Tisch öffnet ein animiertes Profil mit Prozent-Ring und Ergebnisverlauf.",
  },
  {
    key: "landing.klassenpunkt.5.titel",
    typ: "text",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 5 - Überschrift",
    standard: "Prüfungen zusammenstellen oder neu generieren",
  },
  {
    key: "landing.klassenpunkt.5.text",
    typ: "richtext",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 5 - Text",
    standard:
      "Aus bereits geprüften Aufgaben eine Prüfung zusammenstellen (punktegewichtet, ohne zusätzliches Kontingent) - oder komplett neu generieren lassen, inklusive Punkteschema.",
  },
  {
    key: "landing.klassenpunkt.6.titel",
    typ: "text",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 6 - Überschrift",
    standard: "Auch für Maturaklassen gedacht",
  },
  {
    key: "landing.klassenpunkt.6.text",
    typ: "richtext",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Punkt 6 - Text",
    standard:
      "Formeller Prüfungston, AFB-II/III-Schwerpunkt statt reiner Reproduktion, nur prüfungstaugliche Aufgabenformate - für echte Wissensfeststellung, nicht nur Übung.",
  },
  {
    key: "landing.klassenzimmer.label",
    typ: "text",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Beschriftung über der Beispiel-Grafik",
    standard: "Beispielhafte Darstellung - Klassenzimmer-Ansicht",
  },
  {
    key: "landing.klassenzimmer.hinweis",
    typ: "richtext",
    seite: "Landingpage: Klassen & Prüfungen",
    label: "Hinweistext unter der Beispiel-Grafik",
    standard:
      "Statische Beispielabbildung mit frei gewählten Kürzeln statt echter Namen. Nach der Anmeldung ist die echte Ansicht interaktiv: ein Klick auf einen Tisch öffnet dort ein animiertes Profil mit Prozent-Ring und Ergebnisverlauf.",
  },
  {
    key: "landing.community.titel",
    typ: "text",
    seite: "Landingpage: Community",
    label: "Überschrift",
    standard: "Nicht bei null anfangen - von der Auswahl der ganzen Community profitieren",
  },
  {
    key: "landing.community.untertitel",
    typ: "richtext",
    seite: "Landingpage: Community",
    label: "Untertitel",
    standard:
      "Jede Lehrkraft mit Abo kann eigene Arbeitsblätter freigeben - und selbst aus der wachsenden, gefilterten Auswahl der anderen schöpfen, statt jedes Thema von vorne zu erstellen.",
  },
  {
    key: "landing.communitypunkt.1.titel",
    typ: "text",
    seite: "Landingpage: Community",
    label: "Punkt 1 - Überschrift",
    standard: "Freigegebene Arbeitsblätter aller Kolleg:innen",
  },
  {
    key: "landing.communitypunkt.1.text",
    typ: "richtext",
    seite: "Landingpage: Community",
    label: "Punkt 1 - Text",
    standard:
      "Jede Lehrkraft mit Abo kann eigene, bereits geprüfte Arbeitsblätter mit der Community teilen - und umgekehrt von deren Auswahl profitieren.",
  },
  {
    key: "landing.communitypunkt.2.titel",
    typ: "text",
    seite: "Landingpage: Community",
    label: "Punkt 2 - Überschrift",
    standard: "Gezielt filtern statt durchscrollen",
  },
  {
    key: "landing.communitypunkt.2.text",
    typ: "richtext",
    seite: "Landingpage: Community",
    label: "Punkt 2 - Text",
    standard:
      "Nach Grundkompetenz und Schulstufen-Cluster filtern oder per Volltextsuche das passende Blatt für die nächste Stunde finden.",
  },
  {
    key: "landing.communitypunkt.3.titel",
    typ: "text",
    seite: "Landingpage: Community",
    label: "Punkt 3 - Überschrift",
    standard: "Favorisieren für später",
  },
  {
    key: "landing.communitypunkt.3.text",
    typ: "richtext",
    seite: "Landingpage: Community",
    label: "Punkt 3 - Text",
    standard: "Gute Funde direkt markieren - landen in der eigenen Übersicht, ohne bei jedem Mal neu suchen zu müssen.",
  },
  {
    key: "landing.vergleich.titel",
    typ: "text",
    seite: "Landingpage: Vergleich",
    label: "Überschrift",
    standard: "„Reicht dafür nicht einfach ein Chatbot?\"",
  },
  {
    key: "landing.vergleich.untertitel",
    typ: "text",
    seite: "Landingpage: Vergleich",
    label: "Untertitel",
    standard: "Kannst du - der Unterschied ist, was danach noch an dir hängen bleibt.",
  },
  {
    key: "landing.vergleich.spalteChat",
    typ: "text",
    seite: "Landingpage: Vergleich",
    label: "Linke Spalte - Überschrift",
    standard: "Ein normaler Chatbot",
  },
  {
    key: "landing.vergleich.spalteUns",
    typ: "text",
    seite: "Landingpage: Vergleich",
    label: "Rechte Spalte - Überschrift",
    standard: "Lernwerk",
  },
  {
    key: "landing.vergleich.chat.1",
    typ: "richtext",
    seite: "Landingpage: Vergleich",
    label: "Linke Spalte - Punkt 1",
    standard: "Lehrplan, Kompetenzniveau und Quellenregeln musst du selbst formulieren - jedes Mal neu",
  },
  {
    key: "landing.vergleich.chat.2",
    typ: "richtext",
    seite: "Landingpage: Vergleich",
    label: "Linke Spalte - Punkt 2",
    standard:
      "Du bekommst Fließtext, den du selbst in ein druckfertiges Arbeitsblatt bringen musst - mit Recherche, Schreiben und Formatieren schnell 10-15+ Minuten",
  },
  {
    key: "landing.vergleich.chat.3",
    typ: "richtext",
    seite: "Landingpage: Vergleich",
    label: "Linke Spalte - Punkt 3",
    standard: "Niemand prüft die Antwort gegen - die fachliche Kontrolle bleibt komplett bei dir",
  },
  {
    key: "landing.vergleich.chat.4",
    typ: "richtext",
    seite: "Landingpage: Vergleich",
    label: "Linke Spalte - Punkt 4",
    standard: "Kein Verlauf, keine Bibliothek deiner bisherigen Arbeitsblätter",
  },
  {
    key: "landing.vergleich.chat.5",
    typ: "richtext",
    seite: "Landingpage: Vergleich",
    label: "Linke Spalte - Punkt 5",
    standard: "Kein Überblick, welche Klasse welches Thema schon hatte oder wie sie dabei steht",
  },
  {
    key: "landing.vergleich.uns.1",
    typ: "richtext",
    seite: "Landingpage: Vergleich",
    label: "Rechte Spalte - Punkt 1",
    standard: "IGGÖ-Lehrplan, Schulstufen-Cluster und Quellenregeln sind fest eingebaut",
  },
  {
    key: "landing.vergleich.uns.2",
    typ: "richtext",
    seite: "Landingpage: Vergleich",
    label: "Rechte Spalte - Punkt 2",
    standard: "Fertiges PDF/Word zum direkten Ausdrucken - in ca. 3 Minuten statt 10-15+",
  },
  {
    key: "landing.vergleich.uns.3",
    typ: "richtext",
    seite: "Landingpage: Vergleich",
    label: "Rechte Spalte - Punkt 3",
    standard: "Ein zweiter, unabhängiger Kontrollschritt prüft alles gegen, bevor du es siehst",
  },
  {
    key: "landing.vergleich.uns.4",
    typ: "richtext",
    seite: "Landingpage: Vergleich",
    label: "Rechte Spalte - Punkt 4",
    standard: "Alle erstellten Arbeitsblätter gespeichert, favorisierbar, jederzeit wieder abrufbar",
  },
  {
    key: "landing.vergleich.uns.5",
    typ: "richtext",
    seite: "Landingpage: Vergleich",
    label: "Rechte Spalte - Punkt 5",
    standard: "Klassen, Wissensstand und Prüfungen direkt im selben Werkzeug - kein Zettelchaos",
  },
  {
    key: "landing.ablauf.titel",
    typ: "text",
    seite: "Landingpage: Ablauf",
    label: "Überschrift",
    standard: "In drei Schritten fertig",
  },
  {
    key: "landing.ablauf.1.titel",
    typ: "text",
    seite: "Landingpage: Ablauf",
    label: "Schritt 1 - Überschrift",
    standard: "Vorgeben",
  },
  {
    key: "landing.ablauf.1.text",
    typ: "text",
    seite: "Landingpage: Ablauf",
    label: "Schritt 1 - Text",
    standard: "Bereich, Thema, Schulstufe und Layout auswählen.",
  },
  {
    key: "landing.ablauf.2.titel",
    typ: "text",
    seite: "Landingpage: Ablauf",
    label: "Schritt 2 - Überschrift",
    standard: "Prüfen lassen",
  },
  {
    key: "landing.ablauf.2.text",
    typ: "text",
    seite: "Landingpage: Ablauf",
    label: "Schritt 2 - Text",
    standard: "Der Inhalt wird automatisch erstellt und in einem zweiten Schritt unabhängig gegengeprüft.",
  },
  {
    key: "landing.ablauf.3.titel",
    typ: "text",
    seite: "Landingpage: Ablauf",
    label: "Schritt 3 - Überschrift",
    standard: "Drucken",
  },
  {
    key: "landing.ablauf.3.text",
    typ: "text",
    seite: "Landingpage: Ablauf",
    label: "Schritt 3 - Text",
    standard: "Fertiges PDF oder Word direkt herunterladen und austeilen.",
  },
  {
    key: "landing.preis.titel",
    typ: "text",
    seite: "Landingpage: Preis",
    label: "Überschrift",
    standard: "Was du bekommst",
  },
  {
    key: "landing.enthalten.1",
    typ: "richtext",
    seite: "Landingpage: Preis",
    label: "Enthalten - Punkt 1",
    standard:
      "Bewusst nur Aufgabentypen, deren Inhalt sich zuverlässig bewerten lässt statt Nonsens-Vielfalt: Multiple Choice, Lückentext, Zuordnung, Offene Frage, Wahr/Falsch mit Begründung, Reihenfolge, Lesetext",
  },
  {
    key: "landing.enthalten.2",
    typ: "richtext",
    seite: "Landingpage: Preis",
    label: "Enthalten - Punkt 2",
    standard:
      "Speziell für die Kleinsten: Bewegungsaufgabe, Sortierkarten, Malaufgabe und Nachspurübung - vier Aufgabentypen ganz ohne Lese-/Schreibkompetenz für Kinder, die noch nicht lesen/schreiben können",
  },
  {
    key: "landing.enthalten.3",
    typ: "richtext",
    seite: "Landingpage: Preis",
    label: "Enthalten - Punkt 3",
    standard: "Ab Sekundarstufe I: Recherche-/Referatsaufträge mit Leitfaden, Bewertungskriterien und Quellenhinweis",
  },
  {
    key: "landing.enthalten.4",
    typ: "richtext",
    seite: "Landingpage: Preis",
    label: "Enthalten - Punkt 4",
    standard:
      "Koran-Vers oder ganze Sure gezielt auswählen - als reinen Text zum Ausdrucken oder als vollständiges Arbeitsblatt drumherum",
  },
  {
    key: "landing.enthalten.5",
    typ: "richtext",
    seite: "Landingpage: Preis",
    label: "Enthalten - Punkt 5",
    standard: "Fertiges, druckreifes PDF oder Word-Dokument - direkt zum Ausdrucken",
  },
  {
    key: "landing.enthalten.6",
    typ: "richtext",
    seite: "Landingpage: Preis",
    label: "Enthalten - Punkt 6",
    standard: "Eine zweite, unabhängige Prüfung für jedes einzelne Arbeitsblatt",
  },
  {
    key: "landing.enthalten.7",
    typ: "richtext",
    seite: "Landingpage: Preis",
    label: "Enthalten - Punkt 7",
    standard: "Eigene Bibliothek: alle bisher erstellten Arbeitsblätter jederzeit wieder abrufbar",
  },
  {
    key: "landing.enthalten.8",
    typ: "richtext",
    seite: "Landingpage: Preis",
    label: "Enthalten - Punkt 8",
    standard: "Wahlweise mit islamischem Datum und dezentem Ornament-Musterstreifen im Kopfbereich",
  },
  {
    key: "landing.preis.nurImAbo",
    typ: "richtext",
    seite: "Landingpage: Preis",
    label: "Hervorhebung „Nur im Abo“",
    standard:
      "Nur im Abo: Klassenübersicht, Wissensstand-Auswertung, Klassenzimmer-Ansicht, Prüfungserstellung und geteilte Arbeitsblätter von Kolleg:innen",
  },
  {
    key: "landing.preis.wofuerLabel",
    typ: "text",
    seite: "Landingpage: Preis",
    label: "„Wofür wird bezahlt?“ - Label",
    standard: "Wofür wird bezahlt?",
  },
  {
    key: "landing.preis.wofuerText",
    typ: "richtext",
    seite: "Landingpage: Preis",
    label: "„Wofür wird bezahlt?“ - Text",
    standard:
      "Jedes erstellte und geprüfte Arbeitsblatt braucht echte Rechenleistung - das Abo deckt genau diese Kosten sowie den laufenden Betrieb der Plattform, damit sie für die Lehrer:innen-Community dauerhaft kostendeckend weiterbestehen kann.",
  },
  {
    key: "landing.preis.freischaltungHinweis",
    typ: "richtext",
    seite: "Landingpage: Preis",
    label: "Hinweis zur Freischaltung",
    standard:
      "Die Freischaltung einer bezahlten Stufe erfolgt manuell - kontaktiere dazu einfach die Person, die den Zugang für deine Schule/Einrichtung verwaltet.",
  },
  {
    key: "landing.cta.registrierenButton",
    typ: "text",
    seite: "Landingpage: Abschluss",
    label: "Button-Beschriftung",
    standard: "Jetzt kostenlos starten",
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
      "Die Inhalte entstehen mithilfe von künstlicher Intelligenz als Hilfsmittel und richten sich nach dem Lehrplan - Zitate und Fachbegriffe stammen aus einer von uns geprüften Quellen-Bibliothek, nicht aus dem freien Gedächtnis der KI. Bevor ein Arbeitsblatt angezeigt wird, prüft ein zweiter, unabhängiger Durchlauf es noch einmal genau. Trotzdem gilt wie bei jedem Hilfsmittel: Wirf vor dem Einsatz selbst noch einen kurzen Blick darauf.",
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
      "Jedes Arbeitsblatt wird in einem zweiten, unabhängigen Durchlauf noch einmal genau gegengeprüft - auf Quellenangaben, Vollständigkeit, Altersgerechtigkeit und pädagogischen Aufbau - bevor es angezeigt wird. Als zusätzliche Sicherheit solltest du als Lehrkraft trotzdem selbst kurz draufschauen, bevor du es einsetzt.",
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
      "Zitate (z.B. aus Koran und Hadith) und Fachbegriffe stammen aus einer kuratierten, von uns geprüften Quellen-Bibliothek statt aus dem freien Erinnern der künstlichen Intelligenz - jede Quelle ist damit nachvollziehbar.",
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
    hinweis: "Wird auch im Datenschutz-Abschnitt „Verantwortlicher“ als Kontakt angezeigt.",
    standard: "magdykasim30008000@gmail.com",
  },
  {
    key: "datenschutz.verantwortlicherText",
    typ: "text",
    seite: "Datenschutz",
    label: "Verantwortlicher - Name & Anschrift",
    hinweis: "Die Kontakt-E-Mail dahinter kommt aus dem Impressum-Feld „Kontakt-E-Mail“ (siehe dort).",
    standard: "Dua Zentrum, Beethovenplatz 1 (Ecke Lothringerstraße), 1010 Wien, vertreten durch Adam Es.",
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
