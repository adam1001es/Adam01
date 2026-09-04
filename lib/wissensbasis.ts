import { z } from "zod";
import { prisma } from "./prisma";
import { THEMENBEREICH_KEYS, ThemenbereichKey } from "./curriculum";
import { AufgabeSchema, Aufgabe, WorksheetContent } from "./types";

/**
 * Admin-only "Wissensbasis" (siehe prisma/schema.prisma Modell WissensEintrag, app/admin/wissensbasis,
 * lib/wissensMining.ts): mit der Zeit wachsender Pool aus geprüften Zitaten (Koran/Hadith) und
 * besonders gelungenen Musteraufgaben. Zwei Content-Typen teilen sich EIN Modell (typ-Feld
 * unterscheidet), weil beide denselben Lebenszyklus (entwurf -> geprueft/abgelehnt) und dieselbe
 * Zuordnung zu einer Grundkompetenz haben - eine eigene Tabelle pro Typ wäre reine Duplikation.
 */
export const WISSENS_TYPEN = ["zitat", "musteraufgabe", "begriff"] as const;
export type WissensTyp = (typeof WISSENS_TYPEN)[number];

export const WISSENS_STATUS = ["entwurf", "geprueft", "abgelehnt"] as const;
export type WissensStatus = (typeof WISSENS_STATUS)[number];

export const WISSENS_TYP_LABEL: Record<WissensTyp, string> = {
  zitat: "Zitat (Koran/Hadith)",
  musteraufgabe: "Musteraufgabe",
  begriff: "Begriff (islamische Terminologie)",
};

export const WISSENS_STATUS_LABEL: Record<WissensStatus, string> = {
  entwurf: "Entwurf – ungeprüft",
  geprueft: "Geprüft",
  abgelehnt: "Abgelehnt",
};

/** Inhalt eines "zitat"-Eintrags - bewusst ähnlich zu QuelleSchema (lib/types.ts), aber mit
 * eigenem "kontext"-Feld: hier geht es nicht um die Angabe AUF einem fertigen Arbeitsblatt,
 * sondern um einen wiederverwendbaren Wissensbaustein für künftige Generierungen. */
export const ZitatInhaltSchema = z.object({
  bezeichnung: z.string(), // z.B. "Sure 2 (Al-Baqara), Vers 255 - Ayat al-Kursi"
  text: z.string().optional(), // kurze sinngemäße Wiedergabe/Übersetzung, KEIN vollständiges Rechtszitat
  kontext: z.string().optional(), // wofür/in welchem thematischen Zusammenhang einsetzbar
  // Optional, weil viele bereits bestehende Einträge VOR Einführung dieses Felds angelegt wurden
  // (siehe ermittleZitatQuellenart unten für den Umgang mit diesen Alt-Einträgen) - bei jedem NEU
  // angelegten Eintrag setzt die Admin-UI (WissensbasisClient.tsx) es aber verpflichtend, damit
  // der Hadith-Bereich im Erstellen-Formular (siehe geprüfteHadithe) nicht versehentlich einen
  // Koran-Vers als "Hadith" anbietet.
  quellenart: z.enum(["koran", "hadith"]).optional(),
  // Nur bei Hadith-Zitaten relevant - aus welcher Sammlung/welchem Werk der Hadith stammt (z.B.
  // "Nawawi 40", "Sahih al-Bukhari", "Sahih Muslim"). Bewusst freier Text statt fixem Enum: die
  // Sammlung wächst mit der Zeit (siehe ermittleHadithSammlung unten für Alt-Einträge ohne dieses
  // Feld) und soll nicht bei jeder neuen Sammlung einen Code-Change erfordern. Dient als
  // Filter-Kategorie im Hadith-Picker (siehe app/api/hadithe/route.ts, NewWorksheetForm.tsx), da
  // die Wissensbasis mit der Zeit auf viele Dutzend/Hundert Hadithe anwächst.
  sammlung: z.string().optional(),
});
export type ZitatInhalt = z.infer<typeof ZitatInhaltSchema>;

/** Erkennt Koran- vs. Hadith-Zitate: das explizite quellenart-Feld (siehe oben) gewinnt immer,
 * für ältere Einträge OHNE dieses Feld greift eine Bezeichnungs-Heuristik. Koran-Zitate dieses
 * Projekts folgen durchgängig dem Muster "Sure X ... Vers(e) Y" (siehe formatiereKoranZitat in
 * lib/quranApi.ts) - alles andere (Hadith-Sammlungen wie Bukhari/Muslim/Tirmidhi, oder generische
 * Bezeichnungen wie "Hadith über ...") gilt als Hadith. Bewusst konservativ zugunsten "koran" bei
 * einem erkennbaren Sure/Vers-Muster, da ein fälschlich als Hadith eingestuftes Koran-Zitat im
 * Hadith-Picker (Formular) irreführender wäre als der umgekehrte Fall. */
export function ermittleZitatQuellenart(inhalt: ZitatInhalt): "koran" | "hadith" {
  if (inhalt.quellenart) return inhalt.quellenart;
  const istKoranMuster = /sure\s+\d{1,3}\b.{0,20}?vers/i.test(inhalt.bezeichnung);
  return istKoranMuster ? "koran" : "hadith";
}

/** Bekannte Hadith-Sammlungen anhand typischer Namensmuster in der Bezeichnung erkannt - für
 * ältere Einträge OHNE explizites "sammlung"-Feld (siehe ZitatInhaltSchema oben). Reihenfolge
 * unerheblich, da sich die Muster gegenseitig ausschließen. */
const HADITH_SAMMLUNG_MUSTER: { muster: RegExp; label: string }[] = [
  { muster: /nawawi/i, label: "Nawawi 40" },
  { muster: /bukhari|buchari/i, label: "Sahih al-Bukhari" },
  { muster: /\bmuslim\b/i, label: "Sahih Muslim" },
  { muster: /tirmidhi|tirmidi/i, label: "Tirmidhi" },
  { muster: /abu\s*dawud|abu\s*dawood/i, label: "Abu Dawud" },
  { muster: /ibn\s*majah/i, label: "Ibn Majah" },
  { muster: /muwatta|\bmalik\b/i, label: "Muwatta Malik" },
  { muster: /ahmad/i, label: "Musnad Ahmad" },
];

/** Ermittelt die Sammlung/das Werk eines Hadith-Zitats - das explizite "sammlung"-Feld gewinnt
 * immer, sonst greift eine Bezeichnungs-Heuristik (siehe HADITH_SAMMLUNG_MUSTER). Dient als
 * Filter-Kategorie im Hadith-Picker (siehe app/api/hadithe/route.ts), damit die Auswahl auch bei
 * mehreren Hundert Einträgen aus verschiedenen Sammlungen (Nawawi 40, Bukhari, Muslim, ...)
 * übersichtlich bleibt. */
export function ermittleHadithSammlung(inhalt: ZitatInhalt): string {
  if (inhalt.sammlung) return inhalt.sammlung;
  const treffer = HADITH_SAMMLUNG_MUSTER.find((s) => s.muster.test(inhalt.bezeichnung));
  return treffer?.label ?? "Sonstige";
}

/** Kürzt einen Zitat-Text für Übersichtslisten (siehe app/api/hadithe/route.ts) - schneidet NICHT
 * mitten im Wort ab, damit die Vorschau nicht abgehackt wirkt. Mit wachsender Wissensbasis (siehe
 * geprüfteHadithe) soll der Picker den vollen Hadith-Wortlaut nicht ausschreiben, sondern nur zur
 * Wiedererkennung genug Text zeigen - der volle Text kommt bei tatsächlicher Auswahl ohnehin über
 * holeHadithEintrag in die Generierung. */
export function kuerzeZitatVorschau(text: string, maxLaenge = 140): string {
  if (text.length <= maxLaenge) return text;
  return `${text.slice(0, maxLaenge).replace(/\s+\S*$/, "")} …`;
}

/** Inhalt eines "musteraufgabe"-Eintrags - exakt das bestehende Aufgabe-Schema, damit ein
 * geprüfter Eintrag später unverändert als Few-Shot-Beispiel ins Generierungs-Prompt übernommen
 * werden kann (siehe geprüfteMusteraufgaben in diesem Modul). */
export const MusteraufgabeInhaltSchema = AufgabeSchema;

/** Inhalt eines "begriff"-Eintrags - ein Glossar islamischer Fachbegriffe (z.B. "Siyam", "Zakat",
 * "Barzakh"), die künftig als verlässliche, geprüfte Vokabelbasis für Generierung/Erklärungen
 * dienen sollen, statt sich bei jeder Anfrage auf das Modellgedächtnis zu verlassen (analog zu
 * geprüften Zitaten). Wird bewusst NUR angelegt/verwaltet - die Aufnahme in den
 * Generierungs-Prompt (analog zu buildWissensbasisSystemContext) folgt erst, sobald ein
 * ausreichender geprüfter Grundbestand existiert. */
export const BegriffInhaltSchema = z.object({
  begriff: z.string(), // transliterierte Schreibweise, z.B. "Siyam"
  arabisch: z.string().optional(), // arabische Originalschreibweise, z.B. "صيام"
  bedeutung: z.string(), // deutsche Erklärung/Definition
  kontext: z.string().optional(), // wofür/in welchem Zusammenhang gebraucht
});
export type BegriffInhalt = z.infer<typeof BegriffInhaltSchema>;

export interface WissensEintragCreateInput {
  typ: WissensTyp;
  themenbereich: ThemenbereichKey;
  schulstufeCluster?: string | null;
  inhalt: ZitatInhalt | Aufgabe | BegriffInhalt;
  rechercheNotiz?: string;
  quellWorksheetIds?: string[];
}

/** Grober, tolerant vergleichbarer Schlüssel für eine Zitat-Bezeichnung (Kleinschreibung, nur
 * alphanumerische Zeichen) - macht "Sure 2, Vers 255" und "sure 2 vers 255" als dasselbe Zitat
 * erkennbar. Ursprünglich nur in lib/wissensMining.ts (Duplikat-Erkennung beim automatischen
 * Scan) - hierher verschoben, damit dieselbe Prüfung auch beim direkten Anlegen greift (siehe
 * findeVorhandenesZitat unten), nicht nur beim Scan. */
export function normalisiereBezeichnung(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Prüft, ob bereits EIN "zitat"-Eintrag mit (grob normalisiert) derselben Bezeichnung existiert -
 * unabhängig vom Status (auch ein "entwurf" oder "abgelehnt" zählt als vorhanden, es soll ja
 * gerade keine zweite Kopie geben). Wird vor dem Anlegen aufgerufen (siehe
 * app/api/admin/wissensbasis/route.ts), damit derselbe Hadith/Vers nicht mehrfach in der
 * Wissensbasis landet - z.B. wenn ein Link-Import (siehe lib/linkImport.ts) nach einer
 * Grundkompetenz-Korrektur oder einem zweiten Anlauf erneut übernommen wird. */
export async function findeVorhandenesZitat(
  bezeichnung: string,
): Promise<{ id: string; status: WissensStatus } | null> {
  const gesucht = normalisiereBezeichnung(bezeichnung);
  if (!gesucht) return null;
  const bestehende = await prisma.wissensEintrag.findMany({
    where: { typ: "zitat" },
    select: { id: true, inhalt: true, status: true },
  });
  for (const e of bestehende) {
    let inhalt: ZitatInhalt;
    try {
      inhalt = JSON.parse(e.inhalt);
    } catch {
      continue;
    }
    if (normalisiereBezeichnung(inhalt.bezeichnung ?? "") === gesucht) {
      return { id: e.id, status: e.status as WissensStatus };
    }
  }
  return null;
}

/** Gegenstück zu findeVorhandenesZitat für "begriff"-Einträge - verhindert, dass derselbe Begriff
 * (z.B. "Siyam") mehrfach angelegt wird, während der Admin nach und nach das Glossar aufbaut. */
export async function findeVorhandenenBegriff(
  begriff: string,
): Promise<{ id: string; status: WissensStatus } | null> {
  const gesucht = normalisiereBezeichnung(begriff);
  if (!gesucht) return null;
  const bestehende = await prisma.wissensEintrag.findMany({
    where: { typ: "begriff" },
    select: { id: true, inhalt: true, status: true },
  });
  for (const e of bestehende) {
    let inhalt: BegriffInhalt;
    try {
      inhalt = JSON.parse(e.inhalt);
    } catch {
      continue;
    }
    if (normalisiereBezeichnung(inhalt.begriff ?? "") === gesucht) {
      return { id: e.id, status: e.status as WissensStatus };
    }
  }
  return null;
}

/** Legt einen neuen Wissens-Eintrag IMMER als "entwurf" an - unabhängig davon, wer/was den
 * Eintrag erzeugt hat (KI-Recherche, Mining aus Arbeitsblättern, o.ä.). Es gibt bewusst KEINEN
 * Parameter, um direkt mit Status "geprueft" anzulegen: die Freigabe ist ausschließlich ein
 * manueller Schritt eines Admins (siehe setzeStatus). Prüft selbst KEIN Duplikat (siehe
 * findeVorhandenesZitat) - das bleibt Sache der aufrufenden Route, damit z.B. der automatische
 * Scan (lib/wissensMining.ts) seine eigene, andersartige Logik (Konsistenz über mehrere
 * Arbeitsblätter) weiter verwenden kann. */
export async function legeWissensEntwurfAn(input: WissensEintragCreateInput) {
  return prisma.wissensEintrag.create({
    data: {
      typ: input.typ,
      themenbereich: input.themenbereich,
      schulstufeCluster: input.schulstufeCluster ?? null,
      inhalt: JSON.stringify(input.inhalt),
      rechercheNotiz: input.rechercheNotiz,
      quellWorksheetIds: input.quellWorksheetIds ?? [],
      status: "entwurf",
    },
  });
}

/** Setzt Status auf "geprueft" oder "abgelehnt" - NIE auf "entwurf" zurück (dafür gibt es keinen
 * Anwendungsfall: ein bereits entschiedener Eintrag wird bearbeitet+neu entschieden, nicht
 * "zurückgestuft"). Wird ausschließlich von admin-only API-Routen aufgerufen. */
export async function setzeStatus(id: string, status: "geprueft" | "abgelehnt") {
  return prisma.wissensEintrag.update({
    where: { id },
    data: { status, geprueftAm: new Date() },
  });
}

export async function aktualisiereInhalt(
  id: string,
  inhalt: ZitatInhalt | Aufgabe | BegriffInhalt,
  rechercheNotiz?: string,
) {
  return prisma.wissensEintrag.update({
    where: { id },
    data: {
      inhalt: JSON.stringify(inhalt),
      ...(rechercheNotiz !== undefined && { rechercheNotiz }),
    },
  });
}

export async function loescheWissensEintrag(id: string) {
  return prisma.wissensEintrag.delete({ where: { id } });
}

/** Liefert alle GEPRÜFTEN Zitate zu einer Grundkompetenz - die einzige Stelle, an der die
 * Generierung (siehe generateWorksheet.ts) auf die Wissensbasis zugreift. Bewusst nur
 * status "geprueft": ein Entwurf hat keinen menschlichen Sicherheits-Check durchlaufen und darf
 * niemals in eine tatsächliche Generierung einfließen. */
export async function geprüfteZitate(themenbereich: ThemenbereichKey): Promise<
  { id: string; inhalt: ZitatInhalt }[]
> {
  const eintraege = await prisma.wissensEintrag.findMany({
    where: { typ: "zitat", themenbereich, status: "geprueft" },
    orderBy: { geprueftAm: "desc" },
  });
  return eintraege.map((e) => ({ id: e.id, inhalt: JSON.parse(e.inhalt) as ZitatInhalt }));
}

/** Liefert ALLE geprüften Zitate über sämtliche Grundkompetenzen hinweg (Koran UND Hadith) - für
 * die frei durchsuchbare Bibliothek in app/werkzeuge/zitate, im Unterschied zu geprüfteZitate
 * (dort nur EINE Grundkompetenz, für den internen Generierungs-Kontext). */
export async function alleGeprüftenZitate(): Promise<
  { id: string; themenbereich: string; inhalt: ZitatInhalt }[]
> {
  const eintraege = await prisma.wissensEintrag.findMany({
    where: { typ: "zitat", status: "geprueft" },
    orderBy: { geprueftAm: "desc" },
  });
  return eintraege.map((e) => ({
    id: e.id,
    themenbereich: e.themenbereich,
    inhalt: JSON.parse(e.inhalt) as ZitatInhalt,
  }));
}

/** Liefert alle GEPRÜFTEN Hadith-Zitate - optional auf einen Themenbereich eingeschränkt (Filter
 * im Picker des Erstellen-Formulars, siehe NewWorksheetForm.tsx), sonst über alle Grundkompetenzen
 * hinweg. Teilt sich die Tabelle mit Koran-Zitaten (siehe WISSENS_TYP_LABEL.zitat), daher hier
 * zusätzlich per ermittleZitatQuellenart auf "hadith" gefiltert. */
export async function geprüfteHadithe(
  themenbereich?: ThemenbereichKey,
): Promise<{ id: string; themenbereich: string; inhalt: ZitatInhalt }[]> {
  const eintraege = await prisma.wissensEintrag.findMany({
    where: { typ: "zitat", status: "geprueft", ...(themenbereich ? { themenbereich } : {}) },
    orderBy: { geprueftAm: "desc" },
  });
  return eintraege
    .map((e) => ({ id: e.id, themenbereich: e.themenbereich, inhalt: JSON.parse(e.inhalt) as ZitatInhalt }))
    .filter((e) => ermittleZitatQuellenart(e.inhalt) === "hadith");
}

/** Holt EIN bestimmtes, per ID ausgewähltes Hadith-Zitat (siehe GenerateRequestSchema.hadithFokus)
 * - liefert bewusst nur bei tatsächlich geprüftem, als Hadith klassifiziertem Eintrag ein
 * Ergebnis, nie bei einem Entwurf/abgelehnten Eintrag oder einem Koran-Zitat: die Lehrkraft könnte
 * sonst über eine manipulierte Anfrage einen ungeprüften Text in die Generierung einschleusen. */
export async function holeHadithEintrag(id: string): Promise<{ id: string; inhalt: ZitatInhalt } | null> {
  const eintrag = await prisma.wissensEintrag.findUnique({ where: { id } });
  if (!eintrag || eintrag.typ !== "zitat" || eintrag.status !== "geprueft") return null;
  const inhalt = JSON.parse(eintrag.inhalt) as ZitatInhalt;
  if (ermittleZitatQuellenart(inhalt) !== "hadith") return null;
  return { id: eintrag.id, inhalt };
}

/**
 * Baut den System-Prompt-Baustein für den optionalen Hadith-Fokus im Erstellen-Formular (siehe
 * GenerateRequestSchema.hadithFokus) - analog zu buildKoranFokusSystemContext in lib/quranApi.ts,
 * aber ohne Live-Abruf: der Text kommt bereits fertig geprüft aus der eigenen Wissensbasis, es
 * gibt keine externe Quelle zum Nachschlagen.
 */
export function buildHadithFokusSystemContext(eintrag: { inhalt: ZitatInhalt }): string {
  const { bezeichnung, text, kontext } = eintrag.inhalt;
  return `FOKUS-VORGABE DER LEHRKRAFT: Dieses Arbeitsblatt soll sich gezielt um den folgenden, bereits von einem Admin geprüften Hadith drehen, den die Lehrkraft mit der Klasse behandeln möchte. Nutze AUSSCHLIESSLICH diese Angabe als Grundlage, erfinde keinen zusätzlichen Wortlaut hinzu und weiche nicht davon ab:

${bezeichnung}${text ? `\n${text}` : ""}${kontext ? `\n(Kontext: ${kontext})` : ""}

Baue die Aufgaben gezielt um diesen Hadith herum (z.B. inhaltliche Verständnisfragen, Zuordnung von Kernaussagen, Lückentext mit Schlüsselbegriffen) statt eines allgemeinen Themas zur Grundkompetenz. Übernimm die Angabe als eigenen Eintrag in "quellen" mit "bezeichnung": "${bezeichnung}" (exakt in diesem Format) und "sicherheit": "gesichert".`;
}

/**
 * Baut den "reiner Text"-Inhalt für ausgabeform "text" bei inhaltsquelle "hadith" (siehe
 * GenerateRequestSchema) - KEIN Claude-Aufruf, rein deterministisch aus dem bereits geprüften
 * Wissensbasis-Eintrag. Analog zu buildKoranTextContent in lib/quranApi.ts.
 */
export function buildHadithTextContent(
  eintrag: { inhalt: ZitatInhalt },
  schulstufe: string,
): WorksheetContent {
  const { bezeichnung, text, kontext } = eintrag.inhalt;
  return {
    titel: bezeichnung,
    fach: "Islamischer Religionsunterricht",
    schulstufe,
    thema: bezeichnung,
    lernziel: `Den Inhalt von ${bezeichnung} kennenlernen.`,
    einleitung: `${bezeichnung} - geprüfter Hadith aus der Wissensbasis.`,
    aufgaben: [],
    loesungen: [],
    quellen: [{ bezeichnung, sicherheit: "gesichert" as const }],
    hadithZitat: { bezeichnung, text: text ?? "", kontext },
  };
}

/** Liefert alle GEPRÜFTEN Musteraufgaben zu Grundkompetenz + optional Schulstufen-Cluster. */
export async function geprüfteMusteraufgaben(
  themenbereich: ThemenbereichKey,
  schulstufeCluster?: string,
): Promise<{ id: string; inhalt: Aufgabe }[]> {
  const eintraege = await prisma.wissensEintrag.findMany({
    where: {
      typ: "musteraufgabe",
      themenbereich,
      status: "geprueft",
      ...(schulstufeCluster ? { schulstufeCluster } : {}),
    },
    orderBy: { geprueftAm: "desc" },
  });
  return eintraege.map((e) => ({ id: e.id, inhalt: JSON.parse(e.inhalt) as Aufgabe }));
}

/** Liefert alle GEPRÜFTEN Begriffe (Glossar) - optional auf einen Themenbereich eingeschränkt,
 * sonst über alle Grundkompetenzen hinweg. Für den Vokabeltrainer (siehe app/werkzeuge/vokabeln)
 * - nutzt bewusst denselben, bereits admin-geprüften Bestand statt einer eigenen Wortliste. */
export async function geprüfteBegriffe(
  themenbereich?: ThemenbereichKey,
): Promise<{ id: string; themenbereich: string; inhalt: BegriffInhalt }[]> {
  const eintraege = await prisma.wissensEintrag.findMany({
    where: { typ: "begriff", status: "geprueft", ...(themenbereich ? { themenbereich } : {}) },
    orderBy: { geprueftAm: "desc" },
  });
  return eintraege.map((e) => ({
    id: e.id,
    themenbereich: e.themenbereich,
    inhalt: JSON.parse(e.inhalt) as BegriffInhalt,
  }));
}

export interface AufgabentypAnalyseZeile {
  typ: string;
  anzahlArbeitsblaetter: number; // in wie vielen unterschiedlichen Arbeitsblättern kommt der Typ vor
  anzahlVorkommen: number; // Gesamtzahl der Aufgaben dieses Typs über alle Arbeitsblätter
  anzahlGemeldet: number; // davon in einem Arbeitsblatt MIT mindestens einer Meldung
  anzahlGeteilt: number; // davon in einem geteilten Community-Arbeitsblatt
}

/**
 * Grobe Häufigkeits-/Signal-Auswertung pro Aufgabentyp - KEINE exakte Fehlerquote: eine Meldung
 * (siehe Prisma-Modell Meldung) bezieht sich auf das ganze Arbeitsblatt, nicht auf eine einzelne
 * Aufgabe darin, daher ist "anzahlGemeldet" nur ein grobes Signal ("dieser Typ kam in Blättern
 * vor, die Anlass zu einer Meldung gaben"), keine Aussage über die konkrete Aufgabe. Trotzdem
 * nützlich, um Typen mit auffällig hoher Melde-/niedriger Teil-Quote zu identifizieren.
 */
export async function berechneAufgabentypAnalyse(): Promise<AufgabentypAnalyseZeile[]> {
  const [worksheets, meldungen] = await Promise.all([
    prisma.worksheet.findMany({ select: { id: true, contentJson: true, geteilt: true } }),
    prisma.meldung.findMany({ select: { worksheetId: true }, distinct: ["worksheetId"] }),
  ]);
  const gemeldeteIds = new Set(meldungen.map((m) => m.worksheetId));

  const zeilen = new Map<string, AufgabentypAnalyseZeile>();
  for (const w of worksheets) {
    let content: { aufgaben?: { typ?: string }[] };
    try {
      content = JSON.parse(w.contentJson);
    } catch {
      continue;
    }
    const typenInBlatt = new Set<string>();
    for (const a of content.aufgaben ?? []) {
      if (!a.typ) continue;
      typenInBlatt.add(a.typ);
      const zeile = zeilen.get(a.typ) ?? {
        typ: a.typ,
        anzahlArbeitsblaetter: 0,
        anzahlVorkommen: 0,
        anzahlGemeldet: 0,
        anzahlGeteilt: 0,
      };
      zeile.anzahlVorkommen++;
      zeilen.set(a.typ, zeile);
    }
    for (const typ of typenInBlatt) {
      const zeile = zeilen.get(typ)!;
      zeile.anzahlArbeitsblaetter++;
      if (gemeldeteIds.has(w.id)) zeile.anzahlGemeldet++;
      if (w.geteilt) zeile.anzahlGeteilt++;
    }
  }

  return Array.from(zeilen.values()).sort((a, b) => b.anzahlArbeitsblaetter - a.anzahlArbeitsblaetter);
}

/**
 * Baut den optionalen Zusatz-Kontext für die Generierung aus bereits GEPRÜFTEN
 * Wissensbasis-Einträgen (siehe geprüfteZitate/geprüfteMusteraufgaben) - leerer String, solange
 * zu Themenbereich/Schulstufen-Cluster noch nichts freigegeben wurde (der Pool wächst erst mit
 * der Zeit, siehe lib/wissensMining.ts). Wird wie der Lehrplan-Kontext in generateWorksheet.ts
 * NACH dem gecachten Basis-Prompt angehängt, da der Inhalt mit der Zeit wächst und sich damit
 * nicht für einen dauerhaften Cache-Präfix eignet.
 */
export async function buildWissensbasisSystemContext(
  themenbereich: ThemenbereichKey,
  schulstufeCluster: string,
): Promise<string> {
  const [zitate, musteraufgaben] = await Promise.all([
    geprüfteZitate(themenbereich),
    geprüfteMusteraufgaben(themenbereich, schulstufeCluster),
  ]);
  if (zitate.length === 0 && musteraufgaben.length === 0) return "";

  const teile: string[] = [];
  if (zitate.length > 0) {
    teile.push(
      `Vorab geprüfte, verlässliche Zitate zu dieser Grundkompetenz - bevorzugt NUTZEN statt eigene Koran-/Hadith-Angaben zu erfinden, sofern thematisch passend (sie müssen nicht alle verwendet werden):\n` +
        zitate
          .map(
            (z) =>
              `- ${z.inhalt.bezeichnung}${z.inhalt.text ? `: "${z.inhalt.text}"` : ""}${
                z.inhalt.kontext ? ` (${z.inhalt.kontext})` : ""
              }`,
          )
          .join("\n"),
    );
  }
  if (musteraufgaben.length > 0) {
    teile.push(
      `Vorab geprüfte Musteraufgaben zur Orientierung (Stil/Niveau/Qualität - NICHT wortwörtlich kopieren, sondern als Vorbild für eigene, zum konkreten Thema passende Aufgaben verstehen):\n` +
        JSON.stringify(
          musteraufgaben.map((m) => m.inhalt),
          null,
          2,
        ),
    );
  }
  return teile.join("\n\n");
}

export { THEMENBEREICH_KEYS };
