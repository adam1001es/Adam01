import { z } from "zod";
import { THEMENBEREICH_KEYS, ANFORDERUNGSBEREICHE_KEYS } from "./curriculum";
import { ICON_KEYS } from "./icons";

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
] as const;

/** Manche Aufgabentypen sind inhaltlich für sich schon umfangreich (Bildergeschichte: mehrere
 * Bild-Schritte; Kreuzworträtsel/Wortsuche: 4-8 Wörter samt Gitter) - davon macht daher pro
 * Arbeitsblatt höchstens diese Anzahl Sinn, unabhängig von der insgesamt gewählten "Anzahl
 * Aufgaben". "ausmalbild" ist zusätzlich (anders als die anderen drei) NICHT auf einen echten
 * inhaltlichen Grund gedeckelt, sondern rein auf die Kosten: jedes Ausmalbild kann ein neues,
 * per Bild-KI generiertes Bild bedeuten - ohne Deckel könnte "Anzahl Aufgaben" = 10 nur mit
 * "ausmalbild" bis zu 10 Bilder in einem einzigen Arbeitsblatt anfordern und damit das separate
 * Bild-Kontingent (lib/quota.ts, TIER_BILD_QUOTA) aushebeln, das nur Arbeitsblätter zählt, nicht
 * Bilder. Wird sowohl beim Prompt-Bau als auch als harte serverseitige Grenze verwendet (siehe
 * begrenzeAufgabenProTyp in lib/generateWorksheet.ts). */
export const AUFGABEN_TYP_MAXIMUM: Partial<Record<(typeof AUFGABEN_TYPEN)[number], number>> = {
  bildergeschichte: 1,
  kreuzwortraetsel: 1,
  wortsuche: 1,
  ausmalbild: 4,
};

/** Harte Obergrenze für die Anzahl Schritte (= Bilder) einer einzelnen Bildergeschichte-Aufgabe -
 * die Systemprompt-Anweisung nennt "3-5 Schritte" nur als weiche Empfehlung, ohne diese
 * zusätzliche harte Grenze könnte eine einzelne Bildergeschichte theoretisch beliebig viele
 * Schritte/Bilder umfassen (siehe begrenzeBildergeschichteSchritte in lib/generateWorksheet.ts). */
export const BILDERGESCHICHTE_SCHRITTE_MAXIMUM = 6;

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

export const FARBMODI = ["farbe", "schwarzweiss"] as const;
export type Farbmodus = (typeof FARBMODI)[number];

export const MUSTER_VARIANTEN = ["sterne", "halbmond", "stern12"] as const;
export type MusterVariante = (typeof MUSTER_VARIANTEN)[number];

export const LayoutConfigSchema = z.object({
  template: z.enum(TEMPLATES).default("klassisch"),
  schulname: z.string().optional(),
  loesungenSeparat: z.boolean().default(true),
  schriftgroesse: z.enum(["normal", "gross"]).default("normal"),
  zeigeIslamischesDatum: z.boolean().default(true),
  zeigeMuster: z.boolean().default(true),
  musterVariante: z.enum(MUSTER_VARIANTEN).default("sterne"),
  zeigeLernziel: z.boolean().default(false),
  farbmodus: z.enum(FARBMODI).default("farbe"),
});
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;

export const ThemenbereichSchema = z.enum(THEMENBEREICH_KEYS);

export const GenerateRequestSchema = z.object({
  bereich: z.string().min(1),
  thema: z.string().min(1),
  schulstufe: z.string().min(1),
  themenbereich: ThemenbereichSchema.default("gemischt"),
  anzahlAufgaben: z.number().min(1).max(10).default(6),
  aufgabentypen: z.array(z.enum(AUFGABEN_TYPEN)).min(1),
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
