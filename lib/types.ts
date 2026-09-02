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

/** Aktuell im Formular anbietbare und für NEUE Arbeitsblätter generierbare Aufgabentypen.
 * Bewusst auf drei Gruppen begrenzt: die 7 Kern-Typen, deren Inhalt sich zuverlässig schriftlich
 * bewerten lässt (kein mündliches oder rein motorisches Format), die 4 Typen, die als EINZIGE für
 * noch nicht lese-/schreibkundige Erstklässler überhaupt nutzbar sind (siehe
 * istFrueheVolksschulstufe in lib/curriculum.ts) - bei denen zählt "verlässlich bewertbar" im
 * Sinne einer klaren, objektiven Lösung statt einer klassischen schriftlichen Korrektur - sowie
 * "recherche_auftrag" als etablierte Standardmethode ab Sekundarstufe I. WICHTIG zu
 * "recherche_auftrag": das entscheidende Kriterium ist NICHT, ob die App das Ergebnis der
 * Schülerrecherche prüfen kann (kann sie nicht, genauso wenig wie bei jedem anderen Typ das
 * ausgefüllte Blatt selbst) - sondern ob sich die AUFGABENSTELLUNG (Leitfaden,
 * Bewertungskriterien, Quellenhinweis) verlässlich generieren und verifizieren lässt, und das
 * geht hier genauso gut wie bei den anderen Typen.
 * "diskussion" (rein mündlich, es entsteht kein prüfbares schriftliches Ergebnis - anders als bei
 * "recherche_auftrag" ist hier auch die Aufgabenstellung selbst kaum über eine einzelne
 * Fragestellung hinaus prüfbar) sowie die Rätselformate "wortsuche"/"kreuzwortraetsel" (objektiv
 * auswertbar, aber pädagogisch dünn - reine Wiedererkennung/Rechtschreibung statt
 * Verständnisnachweis) sind DESHALB NICHT mehr Teil dieser Liste - schließt daneben weiterhin nur
 * die Bild-KI-Typen aus (siehe Kommentar bei AUFGABEN_TYPEN). Bereits bestehende Arbeitsblätter
 * mit diesen Typen bleiben unverändert ansehbar, druckbar und bearbeitbar (siehe AUFGABEN_TYPEN,
 * AufgabeSchema).
 *
 * Alle Typen sind immer im Erstellen-Formular sichtbar und wählbar, unabhängig von der gewählten
 * Schulstufe - die vier für 1. Klasse Volksschule empfohlenen Typen ("bewegungsaufgabe",
 * "sortierkarten", "malaufgabe", "nachspuruebung") sowie "recherche_auftrag" (ab Sekundarstufe I)
 * bekommen dort zwar eine Empfehlung, das ist aber bewusst nur eine Empfehlung, keine harte
 * Sperre: die Lehrkraft kennt ihre Klasse besser als eine grobe Schulstufen-Heuristik.
 *
 * Reihenfolge ist bewusst NICHT alphabetisch, sondern logisch gruppiert (bestimmt auch die
 * Chip-Reihenfolge im Erstellen-Formular): zuerst die für alle Schulstufen gedachten Kern-Typen,
 * grob von geschlossenen/kurzen zu offeneren Formaten, danach als zusammenhängender Block die
 * vier 1.-Klasse-Empfehlungen (im Formular farblich markiert - als Block sichtbar statt im
 * Raster verstreut), zuletzt der für ältere Schulstufen gedachte Recherche-Auftrag.
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
  "bewegungsaufgabe",
  "sortierkarten",
  "malaufgabe",
  "nachspuruebung",
  "recherche_auftrag",
] as const satisfies readonly (typeof AUFGABEN_TYPEN)[number][];

/** Teilmenge von AUFGABEN_TYPEN_AKTIV, die für eine formelle Prüfung (siehe app/klassen,
 * lib/generateWorksheet.ts "istPruefung"-Zweig, lib/pruefungZusammenstellen.ts) infrage kommt -
 * ausgeschlossen sind die vier für frühe Volksschulstufen gedachten Methoden
 * "malaufgabe"/"bewegungsaufgabe"/"sortierkarten"/"nachspuruebung" (für eine Prüfungssituation
 * nicht gedacht) sowie "recherche_auftrag" (längerfristige Projektarbeit, kein Prüfungsformat,
 * das in einer einzelnen Prüfungssituation abgeschlossen werden könnte). "diskussion" und
 * "wortsuche"/"kreuzwortraetsel" sind ohnehin nicht mehr Teil von AUFGABEN_TYPEN_AKTIV (siehe
 * dortiger Kommentar). Bleibt trotzdem ein eigener, benannter Typ statt einer reinen Ableitung,
 * damit der Prüfungs-Kontext (lib/pruefungZusammenstellen.ts, generateWorksheet.ts
 * "istPruefung") unabhängig von künftigen Änderungen an AUFGABEN_TYPEN_AKTIV explizit bleibt. */
export const EXAM_GEEIGNETE_TYPEN = [
  "multiple_choice",
  "wahr_falsch",
  "zuordnung",
  "lueckentext",
  "reihenfolge",
  "lesetext",
  "offene_frage",
] as const satisfies readonly (typeof AUFGABEN_TYPEN_AKTIV)[number][];

/** Manche Aufgabentypen sind inhaltlich für sich schon umfangreich (Kreuzworträtsel/Wortsuche:
 * 4-8 Wörter samt Gitter; Recherche-/Referat-Auftrag: eigenständige, längerfristige Projektarbeit)
 * - davon macht daher pro Arbeitsblatt höchstens diese Anzahl Sinn, unabhängig von der insgesamt
 * gewählten "Anzahl Aufgaben". Wird sowohl beim Prompt-Bau als auch als harte serverseitige
 * Grenze verwendet (siehe begrenzeAufgabenProTyp in lib/generateWorksheet.ts). Kreuzworträtsel/
 * Wortsuche sind seit der Einschränkung auf zuverlässig bewertbare Typen (siehe
 * AUFGABEN_TYPEN_AKTIV) für NEUE Arbeitsblätter nicht mehr wählbar - ihre Einträge hier bleiben
 * trotzdem bestehen, weil begrenzeAufgabenProTyp auch beim automatischen Beheben gemeldeter
 * Probleme an ÄLTEREN Arbeitsblättern läuft (siehe lib/meldungFix.ts), die diese Typen noch
 * enthalten können. "recherche_auftrag" ist weiterhin für NEUE Arbeitsblätter wählbar. */
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
  punkte: z.number().optional(), // NUR bei Worksheet.istPruefung gesetzt - Punktewert dieser Aufgabe, Summe aller Aufgaben ergibt punkteGesamt
});
export type Aufgabe = z.infer<typeof AufgabeSchema>;

export const QuelleSchema = z.object({
  bezeichnung: z.string(), // z.B. "Koran, Sure 1"
  text: z.string().optional(),
  sicherheit: z.enum(["gesichert", "bitte_pruefen"]),
});
export type Quelle = z.infer<typeof QuelleSchema>;

// Ein einzelner Koran-Vers innerhalb eines "reiner Text"-Arbeitsblatts (siehe koranVerse unten,
// GenerateRequestSchema.ausgabeform "text") - dieselben Felder wie QuranVers (lib/quranApi.ts),
// hier separat definiert, damit lib/types.ts (Basis-Schema-Datei) nicht von lib/quranApi.ts
// abhängen muss.
export const KoranVersSchema = z.object({
  sureNummer: z.number(),
  sureNameTransliteriert: z.string(),
  versNummer: z.number(),
  arabisch: z.string(),
  deutsch: z.string(),
});
export type KoranVersEintrag = z.infer<typeof KoranVersSchema>;

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
  // NUR bei ausgabeform "text" gesetzt (siehe GenerateRequestSchema) - der reine, live
  // abgerufene Koran-Wortlaut ohne KI-generierte Aufgaben drumherum. "aufgaben"/"loesungen"
  // bleiben dabei leer; WorksheetView/WorksheetPdf/buildWorksheetDocx blenden den Aufgaben-/
  // Lösungsblatt-Bereich entsprechend aus und zeigen stattdessen diese Verse.
  koranVerse: z.array(KoranVersSchema).optional(),
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

// Woher der Inhalt eines Arbeitsblatts kommt - eigenständige erste Wahl im Erstellen-Formular
// (siehe NewWorksheetForm.tsx), NICHT nur eine Zusatzoption zu einem freien Thema: manche
// Lehrkräfte wollen gezielt einen Koran-Vers/eine Sure bearbeiten, statt "irgendein Thema, das
// zufällig einen Koran-Bezug hat". "hadith" bewusst noch nicht enthalten (fehlt noch eine
// verlässliche Quelle, siehe lib/linkImport.ts) - Struktur ist aber bereit, das später zu
// ergänzen, ohne GenerateRequestSchema selbst nochmal umbauen zu müssen.
export const INHALTSQUELLEN = ["frei", "koran"] as const;
export type Inhaltsquelle = (typeof INHALTSQUELLEN)[number];
export const INHALTSQUELLE_LABEL: Record<Inhaltsquelle, string> = {
  frei: "Freies Thema",
  koran: "Koran (Sure/Verse)",
};

// Nur bei inhaltsquelle "koran" wählbar (siehe NewWorksheetForm.tsx) - "text" braucht keinen
// Claude-Aufruf (siehe app/api/generate/route.ts) und zählt daher auch nicht zum Kontingent,
// analog zu Prüfungs-Modus A (lib/pruefungZusammenstellen.ts): der Vers-Wortlaut selbst kommt
// bereits fertig und geprüft von der Koran-API, es gibt nichts zu generieren.
export const AUSGABEFORMEN = ["arbeitsblatt", "text"] as const;
export type Ausgabeform = (typeof AUSGABEFORMEN)[number];
export const AUSGABEFORM_LABEL: Record<Ausgabeform, string> = {
  arbeitsblatt: "Arbeitsblatt mit Aufgaben",
  text: "Nur Text (zum Ausdrucken)",
};

export const GenerateRequestSchema = z
  .object({
    bereich: z.string().min(1),
    // Bei inhaltsquelle "koran" optional: der Titel kommt dann entweder von Claude selbst
    // (ausgabeform "arbeitsblatt") oder wird serverseitig aus der Sure/Vers-Angabe abgeleitet
    // (ausgabeform "text") - ein leeres Thema-Feld ist in diesem Fall kein fehlender Wunsch,
    // sondern schlicht nicht nötig. Pflicht bleibt es nur bei inhaltsquelle "frei" (siehe
    // superRefine unten).
    thema: z.string().default(""),
    schulstufe: z.string().min(1),
    themenbereich: ThemenbereichSchema.default("gemischt"),
    inhaltsquelle: z.enum(INHALTSQUELLEN).default("frei"),
    ausgabeform: z.enum(AUSGABEFORMEN).default("arbeitsblatt"),
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
    // Nur bei ausgabeform "arbeitsblatt" Pflicht (siehe superRefine unten) - bei "text" gibt es
    // keine Aufgaben, nur den reinen Vers-Wortlaut.
    aufgabentypen: z.array(z.enum(AUFGABEN_TYPEN_AKTIV)).default([]),
    zusatzhinweise: z.string().optional(),
    layout: LayoutConfigSchema,
    // Prüfungs-Modus B (komplette Neu-Generierung als formelle Prüfung, siehe app/klassen und
    // lib/generateWorksheet.ts) - im Unterschied zu Modus A (lib/pruefungZusammenstellen.ts,
    // stellt aus bereits vorhandenen Arbeitsblättern zusammen) zählt dieser Weg wie ein normales
    // Arbeitsblatt zum Kontingent (siehe app/api/generate/route.ts).
    istPruefung: z.boolean().default(false),
    punkteGesamt: z.number().int().min(1).max(200).optional(),
    // Nur gesetzt, wenn diese Prüfung direkt aus dem Kontext einer Klasse heraus erstellt wird
    // (siehe app/klassen/[id]/pruefung-generieren) - die Route legt dann serverseitig automatisch
    // eine Zuweisung an dieser Klasse an, statt das Arbeitsblatt "lose" zu erzeugen.
    klasseId: z.string().optional(),
    // Optional: Lehrkraft möchte eine konkrete Sure (ganz oder ein Versbereich) mit der Klasse
    // lernen - das Arbeitsblatt wird dann gezielt um den live von der Koran-API abgerufenen,
    // garantiert korrekten Text herum aufgebaut (siehe lib/quranApi.ts, lib/generateWorksheet.ts),
    // statt sich auf Claudes Erinnerung zu verlassen. "Ganze Sure" wird im Formular als
    // vonVers=1/bisVers=Versanzahl abgebildet, kein eigener Modus nötig. Auf MAX_VERSE_PRO_ABFRAGE
    // (siehe lib/quranApi.ts) begrenzt - für längere Suren mehrere Arbeitsblätter nacheinander.
    koranFokus: z
      .object({
        sureNummer: z.number().int().min(1).max(114),
        vonVers: z.number().int().min(1),
        bisVers: z.number().int().min(1),
      })
      .refine((v) => v.bisVers >= v.vonVers, { message: "„Bis Vers“ darf nicht kleiner als „Von Vers“ sein." })
      .optional(),
  })
  .superRefine((req, ctx) => {
    if (req.klasseId && !req.istPruefung) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["klasseId"],
        message: "klasseId ist nur zusammen mit istPruefung gültig.",
      });
    }
    if ((req.inhaltsquelle === "koran" || req.ausgabeform === "text") && !req.koranFokus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["koranFokus"],
        message: "Für die Inhaltsquelle „Koran“ ist eine Sure-/Versauswahl erforderlich.",
      });
    }
    if (req.ausgabeform === "arbeitsblatt") {
      if (req.aufgabentypen.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["aufgabentypen"],
          message: "Bitte mindestens einen Aufgabentyp auswählen.",
        });
      }
      if (req.inhaltsquelle === "frei" && !req.thema) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["thema"],
          message: "Bitte ein Thema angeben.",
        });
      }
    }
    if (!req.istPruefung) return;
    if (req.punkteGesamt === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["punkteGesamt"],
        message: "Für eine Prüfung ist eine Zielpunktzahl erforderlich.",
      });
    }
    const erlaubt = new Set<string>(EXAM_GEEIGNETE_TYPEN);
    const unerlaubt = req.aufgabentypen.filter((t) => !erlaubt.has(t));
    if (unerlaubt.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["aufgabentypen"],
        message: `Für eine Prüfung nicht geeignete Aufgabentypen ausgewählt: ${unerlaubt.join(", ")}.`,
      });
    }
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
