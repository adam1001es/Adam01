import { z } from "zod";
import { THEMENBEREICH_KEYS, ANFORDERUNGSBEREICHE_KEYS } from "./curriculum";
import { ICON_KEYS } from "./icons";

// "ausmalbild"/"bildergeschichte" (KI-generierte Bilder) bleiben Teil dieser Liste, obwohl sie
// NICHT mehr angeboten werden (siehe AUFGABEN_TYPEN_AKTIV unten) - Aufgabentypen-Redesign: statt
// vieler Typen bewusst wenige, didaktisch besonders hochwertige Methoden ("lieber 4-5 gute
// Methoden als 8-10 Nonsenses"). "lueckentext"/"diskussion" bleiben dagegen bewusst mit aktiv
// (siehe AUFGABEN_TYPEN_AKTIV) - aufgewertet statt gestrichen (siehe Prompt-Vorgaben in
// generateWorksheet.ts). Bestehende Arbeitsblätter mit Bild-Typen bleiben unverändert
// lesbar/druckbar - dafür müssen AufgabeSchema/WorksheetContentSchema unten diese Werte
// weiterhin akzeptieren.
export const AUFGABEN_TYPEN = [
  "multiple_choice",
  "lueckentext",
  "zuordnung",
  "offene_frage",
  "wahr_falsch",
  "ausmalbild",
  "bildergeschichte",
  "reihenfolge",
  "lesetext",
  "diskussion",
  "wortsuche",
  "kreuzwortraetsel",
  "malaufgabe",
  "recherche_auftrag",
  "bewegungsaufgabe",
  "sortierkarten",
  "nachspuruebung",
] as const;

/** Aktuell im Formular anbietbare und für NEUE Arbeitsblätter generierbare Aufgabentypen -
 * schließt nur die Bild-KI-Typen aus (siehe Kommentar bei AUFGABEN_TYPEN). Alle Typen sind immer
 * im Erstellen-Formular sichtbar und wählbar, unabhängig von der gewählten Schulstufe - die vier
 * für 1. Klasse Volksschule empfohlenen Typen ("bewegungsaufgabe", "sortierkarten",
 * "malaufgabe", "nachspuruebung") sowie "recherche_auftrag" (ab Sekundarstufe I) bekommen dort
 * zwar eine Empfehlung (siehe istFrueheVolksschulstufe in lib/curriculum.ts), das ist aber
 * bewusst nur eine Empfehlung, keine harte Sperre: die Lehrkraft kennt ihre Klasse besser als
 * eine grobe Schulstufen-Heuristik.
 *
 * Reihenfolge ist bewusst NICHT alphabetisch, sondern logisch gruppiert (bestimmt auch die
 * Chip-Reihenfolge im Erstellen-Formular): zuerst die für alle Schulstufen gedachten Typen, grob
 * von geschlossenen/kurzen zu offeneren/umfangreicheren Formaten, danach als zusammenhängender
 * Block die vier 1.-Klasse-Empfehlungen (im Formular farblich markiert - als Block sichtbar
 * statt im Raster verstreut), zuletzt der für ältere Schulstufen gedachte Recherche-Auftrag.
 *
 * Wird für GenerateRequestSchema.aufgabentypen sowie im Erstellen-Formular verwendet. Bewusst
 * als eigenes Array-Literal statt per .filter() von AUFGABEN_TYPEN abgeleitet, damit z.enum()
 * weiterhin ein literales Tupel (statt eines generischen string[]) zur Typprüfung bekommt. */
export const AUFGABEN_TYPEN_AKTIV = [
  "multiple_choice",
  "wahr_falsch",
  "zuordnung",
  "lueckentext",
  "reihenfolge",
  "lesetext",
  "offene_frage",
  "diskussion",
  "wortsuche",
  "kreuzwortraetsel",
  "bewegungsaufgabe",
  "sortierkarten",
  "malaufgabe",
  "nachspuruebung",
  "recherche_auftrag",
] as const satisfies readonly (typeof AUFGABEN_TYPEN)[number][];

/** Manche Aufgabentypen sind inhaltlich für sich schon umfangreich (Kreuzworträtsel/Wortsuche:
 * 4-8 Wörter samt Gitter; Recherche-/Referat-Auftrag: eigenständige, längerfristige Projektarbeit)
 * - davon macht daher pro Arbeitsblatt höchstens diese Anzahl Sinn, unabhängig von der insgesamt
 * gewählten "Anzahl Aufgaben". Wird sowohl beim Prompt-Bau als auch als harte serverseitige
 * Grenze verwendet (siehe begrenzeAufgabenProTyp in lib/generateWorksheet.ts). */
export const AUFGABEN_TYP_MAXIMUM: Partial<Record<(typeof AUFGABEN_TYPEN)[number], number>> = {
  kreuzwortraetsel: 1,
  wortsuche: 1,
  recherche_auftrag: 1,
  sortierkarten: 1, // viele Ausschneide-/Klebe-Kärtchen - für sich schon umfangreich, siehe unten
};

/** Harte Obergrenze für die Anzahl Schritte (= Bilder) einer einzelnen Bildergeschichte-Aufgabe -
 * die Systemprompt-Anweisung nennt "3-5 Schritte" nur als weiche Empfehlung, ohne diese
 * zusätzliche harte Grenze könnte eine einzelne Bildergeschichte theoretisch beliebig viele
 * Schritte/Bilder umfassen (siehe begrenzeBildergeschichteSchritte in lib/generateWorksheet.ts). */
export const BILDERGESCHICHTE_SCHRITTE_MAXIMUM = 6;

/** Grobe Richtzeit in Minuten pro Aufgabentyp bei "mittlerer" Komplexität (siehe
 * KOMPLEXITAET_FAKTOR) - Schätzwerte für eine durchschnittliche Bearbeitung im Unterricht, KEINE
 * exakte Messung (v.a. "diskussion"/"offene_frage" schwanken naturgemäß stark je nach Klasse).
 * Grundlage für die Zieldauer-basierte Aufgabenanzahl statt einer reinen, zeitunabhängigen
 * Stückzahl (siehe schaetzeAufgabenAnzahl unten und GenerateRequestSchema.zieldauerMinuten). */
export const AUFGABEN_TYP_RICHTZEIT_MINUTEN: Record<(typeof AUFGABEN_TYPEN)[number], number> = {
  wahr_falsch: 2, // jetzt mit Pflicht-Begründung (siehe generateWorksheet.ts), daher etwas mehr als die reine Ja/Nein-Einordnung
  multiple_choice: 2,
  zuordnung: 3,
  reihenfolge: 3,
  lueckentext: 3,
  offene_frage: 4,
  ausmalbild: 6,
  lesetext: 6,
  diskussion: 8,
  wortsuche: 8,
  malaufgabe: 10, // Zeichnen dauert bei Kleinkindern erfahrungsgemäß länger als ein reiner Ausmal-Auftrag
  // Nur die Einführung/Erklärung im Unterricht - die eigentliche Recherche/Präsentation ist
  // bewusst eine längerfristige Projekt-/Hausaufgabe außerhalb dieser Unterrichtseinheit (siehe
  // AUFGABEN_TYP_MAXIMUM: max. 1 pro Arbeitsblatt).
  recherche_auftrag: 10,
  kreuzwortraetsel: 10,
  bildergeschichte: 12,
  bewegungsaufgabe: 8, // Vorlesen + Reagieren der ganzen Klasse (Total Physical Response)
  nachspuruebung: 8, // mehrfaches Nachfahren eines Wortes/einer Phrase
  sortierkarten: 12, // Ausschneiden + Zuordnen dauert bei Kleinkindern erfahrungsgemäß länger
};

export const KOMPLEXITAET_STUFEN = ["einfach", "mittel", "anspruchsvoll"] as const;
export type Komplexitaet = (typeof KOMPLEXITAET_STUFEN)[number];

export const KOMPLEXITAET_LABEL: Record<Komplexitaet, string> = {
  einfach: "Einfach",
  mittel: "Mittel",
  anspruchsvoll: "Anspruchsvoll",
};

/** Skaliert die Richtzeit je nach gewählter Komplexität - wirkt sich zusätzlich (siehe
 * buildCurriculumSystemContext in lib/curriculum.ts) auf den Anforderungsbereich-Schwerpunkt der
 * generierten Aufgaben aus: höhere Komplexität = tendenziell mehr AFB II/III und tiefere
 * Fragestellungen (innerhalb dessen, was die Schulstufe zulässt), nicht nur mehr Zeit pro Aufgabe. */
export const KOMPLEXITAET_FAKTOR: Record<Komplexitaet, number> = {
  einfach: 0.75,
  mittel: 1,
  anspruchsvoll: 1.3,
};

export const ZIELDAUER_OPTIONEN_MINUTEN = [20, 35, 50] as const;

/** Fixer Puffer für Einstieg (Begrüßung/Wiederholung) und Abschluss (Reflexion) einer
 * Unterrichtseinheit, angelehnt an den üblichen Ablauf einer 50-minütigen österreichischen
 * Unterrichtsstunde - nur die restliche Zeit steht für die Arbeitsblatt-Aufgaben selbst zur
 * Verfügung. */
export const ZIELDAUER_PUFFER_MINUTEN = 10;

/** Leitet aus Zieldauer, gewählten Aufgabentypen und Komplexität eine Richtwert-Anzahl an
 * Aufgaben ab - ersetzt eine direkte "Anzahl Aufgaben"-Eingabe, die nichts über die tatsächliche
 * Bearbeitungszeit im Unterricht aussagt. Wird sowohl im Erstellen-Formular für die Live-Vorschau
 * als auch serverseitig (autoritativ, siehe lib/generateWorksheet.ts) verwendet - rein
 * arithmetisch, keine externen Abhängigkeiten, daher clientseitig ohne Weiteres importierbar.
 * Exakte Minutentreue ist NICHT das Ziel (nicht erreichbar) - nur eine deutlich bessere Näherung
 * als eine reine, zeitunabhängige Stückzahl. */
export function schaetzeAufgabenAnzahl(
  zieldauerMinuten: number,
  aufgabentypen: (typeof AUFGABEN_TYPEN)[number][],
  komplexitaet: Komplexitaet,
): number {
  if (aufgabentypen.length === 0) return 0;
  const faktor = KOMPLEXITAET_FAKTOR[komplexitaet];
  const durchschnittsZeit =
    aufgabentypen.reduce((summe, typ) => summe + AUFGABEN_TYP_RICHTZEIT_MINUTEN[typ], 0) /
    aufgabentypen.length;
  const budget = Math.max(zieldauerMinuten - ZIELDAUER_PUFFER_MINUTEN, 5);
  const anzahl = Math.round(budget / (durchschnittsZeit * faktor));

  // Wenn AUSSCHLIESSLICH Aufgabentypen mit eigener Obergrenze gewählt sind (siehe
  // AUFGABEN_TYP_MAXIMUM - z.B. nur "Bildergeschichte", max. 1 pro Arbeitsblatt), kann die
  // zeitbasierte Schätzung nie erreicht werden: es gibt keinen unbegrenzten Aufgabentyp, der die
  // Differenz auffüllen könnte. Ohne diese Deckelung zeigte die Vorschau z.B. "ca. 2 Aufgaben" an,
  // obwohl serverseitig (siehe begrenzeAufgabenProTyp in lib/generateWorksheet.ts) höchstens 1
  // tatsächlich erzeugt werden kann - lässt sich sonst auch nicht mit der festen Mindestanzahl 2
  // unten vereinbaren.
  const machbareObergrenze = aufgabentypen.every((typ) => typ in AUFGABEN_TYP_MAXIMUM)
    ? aufgabentypen.reduce((summe, typ) => summe + (AUFGABEN_TYP_MAXIMUM[typ] ?? 0), 0)
    : Infinity;

  return Math.max(1, Math.min(10, machbareObergrenze, Math.max(2, anzahl)));
}

export const BildergeschichteSchrittSchema = z.object({
  bild: z.enum(ICON_KEYS).optional(), // festes Icon aus der kuratierten Bibliothek
  bildBeschreibung: z.string().optional(), // ODER: neues Motiv, per Bild-KI erzeugt (siehe lib/imageGen.ts) - nur Gegenstände/Tiere/Natur/Gebäude, nie Personen
  bildGeneriertId: z.string().optional(), // wird NICHT von Claude gesetzt, sondern nachträglich vom Server nach erfolgreicher, sicherheitsgeprüfter Generierung
  vorlesetext: z.string(), // Satz, den die Lehrkraft laut vorliest - für noch nicht lesekundige Kinder
});
export type BildergeschichteSchritt = z.infer<typeof BildergeschichteSchrittSchema>;

export const WortsucheGitterSchema = z.array(z.array(z.string()));

export const KreuzwortZelleSchema = z.object({
  buchstabe: z.string(),
  nummer: z.number().nullable(),
});
export const KreuzwortGitterSchema = z.array(z.array(KreuzwortZelleSchema.nullable()));

export const KreuzwortHinweisSchema = z.object({
  nummer: z.number(),
  hinweis: z.string(),
  antwort: z.string(),
});

export const KreuzwortEintragSchema = z.object({
  frage: z.string(),
  antwort: z.string(),
});

/** Eine einzelne Ausschneide-Karte bei "sortierkarten" - "kategorie" MUSS einem Eintrag in
 * "sortierKategorien" der Aufgabe entsprechen, wird aber NUR in der Lösung verwendet (siehe
 * WorksheetView.tsx): auf dem eigentlichen Arbeitsblatt zeigt die Karte nur "text", die
 * richtige Zuordnung ist schließlich der Kern der Übung. */
export const SortierKarteSchema = z.object({
  text: z.string(),
  kategorie: z.string(),
});

export const AufgabeSchema = z.object({
  nr: z.number(),
  typ: z.enum(AUFGABEN_TYPEN),
  frage: z.string(),
  optionen: z.array(z.string()).optional(),
  zuordnungLinks: z.array(z.string()).optional(),
  zuordnungRechts: z.array(z.string()).optional(),
  wortliste: z.array(z.string()).optional(), // Wortliste zur Auswahl bei Lückentext-Aufgaben
  bild: z.enum(ICON_KEYS).optional(), // festes Icon aus der kuratierten Bibliothek, bei "ausmalbild"
  bildBeschreibung: z.string().optional(), // ODER: neues Motiv, per Bild-KI erzeugt - nur Gegenstände/Tiere/Natur/Gebäude, nie Personen
  bildGeneriertId: z.string().optional(), // wird NICHT von Claude gesetzt, sondern nachträglich vom Server gesetzt
  bildergeschichteSchritte: z.array(BildergeschichteSchrittSchema).optional(), // bei "bildergeschichte"
  reihenfolgeElemente: z.array(z.string()).optional(), // bei "reihenfolge", in der RICHTIGEN Reihenfolge (wird beim Druck gemischt angezeigt)
  lesetext: z.string().optional(), // kurzer Lesetext bei "lesetext", auf den sich "frage" bezieht
  wortsucheWoerter: z.array(z.string()).optional(), // bei "wortsuche": von Claude vorgeschlagene Wörter: nach Auflösung nur noch die tatsächlich im Gitter platzierten
  wortsucheGitter: WortsucheGitterSchema.optional(), // wird NICHT von Claude gesetzt, sondern nachträglich vom Server erzeugt (siehe lib/wortsuche.ts)
  kreuzwortEintraege: z.array(KreuzwortEintragSchema).optional(), // bei "kreuzwortraetsel": von Claude vorgeschlagene Hinweis/Antwort-Paare
  kreuzwortGitter: KreuzwortGitterSchema.optional(), // wird NICHT von Claude gesetzt, sondern nachträglich vom Server erzeugt (siehe lib/kreuzwortraetsel.ts)
  kreuzwortWaagerecht: z.array(KreuzwortHinweisSchema).optional(), // wird NICHT von Claude gesetzt
  kreuzwortSenkrecht: z.array(KreuzwortHinweisSchema).optional(), // wird NICHT von Claude gesetzt
  leitfaden: z.array(z.string()).optional(), // bei "recherche_auftrag": konkrete Recherchefragen/Gliederungspunkte für die Präsentation
  bewertungskriterien: z.array(z.string()).optional(), // bei "recherche_auftrag": woran eine gute Bearbeitung erkennbar ist (statt fixer "Lösung" bei offener Recherche)
  quellenhinweis: z.string().optional(), // bei "recherche_auftrag": Hinweis zu vertrauenswürdigen Quellenarten ODER kurzer Sachtext als Recherchebasis ohne Internetzugang
  bewegungsElemente: z.array(z.string()).optional(), // bei "bewegungsaufgabe": Begriffe/Sätze, die die Lehrkraft nacheinander vorliest (Mischung aus passenden und nicht-passenden Elementen, siehe "loesung")
  sortierKategorien: z.array(z.string()).optional(), // bei "sortierkarten": die Kategorie-Spalten, in die die Karten sortiert werden
  sortierKarten: z.array(SortierKarteSchema).optional(), // bei "sortierkarten": die Ausschneide-Kärtchen
  nachspurText: z.string().optional(), // bei "nachspuruebung": das kurze Wort/die Phrase zum Nachfahren
  anforderungsbereich: z.enum(ANFORDERUNGSBEREICHE_KEYS).optional(),
});
export type Aufgabe = z.infer<typeof AufgabeSchema>;

export const QuelleSchema = z.object({
  bezeichnung: z.string(), // z.B. "Koran, Sure 1"
  text: z.string().optional(),
  sicherheit: z.enum(["gesichert", "bitte_pruefen"]),
});
export type Quelle = z.infer<typeof QuelleSchema>;

export const WorksheetContentSchema = z.object({
  titel: z.string(),
  fach: z.string(),
  schulstufe: z.string(),
  thema: z.string(),
  lernziel: z.string(),
  einleitung: z.string(),
  aufgaben: z.array(AufgabeSchema),
  loesungen: z.array(z.object({ nr: z.number(), loesung: z.string() })),
  quellen: z.array(QuelleSchema).default([]),
});
export type WorksheetContent = z.infer<typeof WorksheetContentSchema>;

export const VerificationSchema = z.object({
  status: z.enum(["ok", "warnung", "fehler"]),
  zusammenfassung: z.string(),
  hinweise: z.array(z.string()).default([]),
});
export type Verification = z.infer<typeof VerificationSchema>;

export const TEMPLATES = ["klassisch", "modern", "kompakt"] as const;
export type Template = (typeof TEMPLATES)[number];

// Schwarzweiß zuerst: die meisten Lehrkräfte drucken in der Schule überwiegend Schwarz-Weiß
// (Toner/Tinte sparen) - das ist daher auch der Formular-Standard, siehe LayoutConfigSchema unten.
export const FARBMODI = ["schwarzweiss", "farbe"] as const;
export type Farbmodus = (typeof FARBMODI)[number];

export const MUSTER_VARIANTEN = ["sterne", "halbmond", "stern12"] as const;
export type MusterVariante = (typeof MUSTER_VARIANTEN)[number];

// Lösungen werden IMMER auf einem separaten Blatt/Seite/Dokumentabschnitt ausgegeben, nie auf
// dem Arbeitsblatt selbst - dafür gibt es bewusst keine Layout-Option mehr (siehe WorksheetView,
// WorksheetPdf, buildWorksheetDocx): eine Lehrkraft, die das Blatt direkt an Schüler:innen
// weitergibt, darf nie versehentlich die Lösungen mitschicken.
export const LayoutConfigSchema = z.object({
  template: z.enum(TEMPLATES).default("klassisch"),
  schulname: z.string().optional(),
  schriftgroesse: z.enum(["normal", "gross"]).default("normal"),
  zeigeIslamischesDatum: z.boolean().default(true),
  zeigeMuster: z.boolean().default(true),
  musterVariante: z.enum(MUSTER_VARIANTEN).default("sterne"),
  zeigeLernziel: z.boolean().default(false),
  farbmodus: z.enum(FARBMODI).default("schwarzweiss"),
});
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;

export const ThemenbereichSchema = z.enum(THEMENBEREICH_KEYS);

export const GenerateRequestSchema = z.object({
  bereich: z.string().min(1),
  thema: z.string().min(1),
  schulstufe: z.string().min(1),
  themenbereich: ThemenbereichSchema.default("gemischt"),
  // Ersetzt eine direkte "Anzahl Aufgaben"-Eingabe: die tatsächliche Aufgabenanzahl wird daraus
  // serverseitig abgeleitet (siehe schaetzeAufgabenAnzahl), weil eine reine Stückzahl nichts über
  // die tatsächliche Bearbeitungszeit im Unterricht aussagt.
  zieldauerMinuten: z
    .number()
    .int()
    .refine((v) => (ZIELDAUER_OPTIONEN_MINUTEN as readonly number[]).includes(v), {
      message: "Ungültige Zieldauer.",
    })
    .default(35),
  komplexitaet: z.enum(KOMPLEXITAET_STUFEN).default("mittel"),
  // "malaufgabe" und "recherche_auftrag" sind zwar in erster Linie für 1. Klasse Volksschule
  // bzw. ab Sekundarstufe I gedacht (siehe die entsprechenden Empfehlungs-Hinweise im
  // Erstellen-Formular sowie die Anleitung an Claude in generateWorksheet.ts/curriculum.ts) -
  // eine harte serverseitige Sperre dafür gibt es aber bewusst NICHT (mehr): die Lehrkraft kennt
  // ihre Klasse besser als eine grobe Schulstufen-Heuristik (z.B. eine leistungsstarke 3. Klasse
  // Volksschule oder eine jahrgangsgemischte Gruppe) und soll frei wählen können, statt am
  // Absenden mit einem Validierungsfehler auszusteigen.
  aufgabentypen: z.array(z.enum(AUFGABEN_TYPEN_AKTIV)).min(1),
  zusatzhinweise: z.string().optional(),
  layout: LayoutConfigSchema,
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

/** Kategorien für eine Lehrkraft-Meldung zu einem Arbeitsblatt (siehe Prisma-Modell Meldung) -
 * Grundlage für eine manuelle Erstattung/Nachbesserung durch den Admin. */
export const MELDUNG_KATEGORIEN = [
  "aufgabe_fehlt",
  "bild_fehlerhaft",
  "text_fehlerhaft",
  "sonstiges",
] as const;
export type MeldungKategorie = (typeof MELDUNG_KATEGORIEN)[number];

export const MELDUNG_KATEGORIE_LABEL: Record<MeldungKategorie, string> = {
  aufgabe_fehlt: "Eine Aufgabe fehlt/ist unvollständig",
  bild_fehlerhaft: "Ein Bild ist fehlerhaft",
  text_fehlerhaft: "Ein Text ist fehlerhaft",
  sonstiges: "Sonstiges",
};

export const MeldungRequestSchema = z.object({
  kategorie: z.enum(MELDUNG_KATEGORIEN),
  beschreibung: z.string().max(2000).optional(),
});
export type MeldungRequest = z.infer<typeof MeldungRequestSchema>;

/** Request-Schema für die KI-Themenideen-Funktion (siehe app/api/thema-ideen/route.ts) - liefert
 * Inspiration für Lehrkräfte ohne eigene Thema-Idee, unabhängig vom Arbeitsblatt-Kontingent. */
export const ThemaIdeenRequestSchema = z.object({
  schulstufe: z.string().min(1),
  themenbereich: z.enum(THEMENBEREICH_KEYS),
});
export type ThemaIdeenRequest = z.infer<typeof ThemaIdeenRequestSchema>;

export const ThemaIdeenAntwortSchema = z.object({
  ideen: z.array(z.string().min(1)).min(1),
});

/** Ergebnis-Status der automatischen Meldungs-Analyse (siehe lib/meldungFix.ts), auch für die
 * Anzeige unter /admin/meldungen und im MeldungButton nach dem Absenden. */
export const MELDUNG_STATUS_LABEL: Record<string, string> = {
  offen: "Wird noch analysiert …",
  automatisch_behoben: "Automatisch behoben",
  nicht_behebbar: "Bestätigt, nicht automatisch behebbar",
  kein_fehler_gefunden: "Kein Fehler gefunden",
  fehler: "Analyse fehlgeschlagen",
};

/** Antwortschema der KI-Analyse einer Meldung (lib/meldungFix.ts): entscheidet, ob das
 * gemeldete Problem real ist, und liefert bei Erfolg gleich den vollständigen korrigierten
 * Arbeitsblatt-Inhalt im selben Schema wie die normale Generierung zurück. */
export const MeldungAnalyseSchema = z.object({
  problemBestaetigt: z.boolean(),
  diagnose: z.string(),
  korrigierterInhalt: WorksheetContentSchema.nullable().optional(),
});
export type MeldungAnalyse = z.infer<typeof MeldungAnalyseSchema>;
