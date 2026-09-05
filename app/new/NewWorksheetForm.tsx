"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ListChecks,
  LayoutTemplate,
  Wand2,
  CheckSquare,
  PenLine,
  ArrowLeftRight,
  MessageSquareText,
  ToggleLeft,
  Eye,
  ListOrdered,
  BookOpenText,
  Palette,
  FileSearch,
  PersonStanding,
  LayoutGrid,
  PenTool,
  Sparkles,
  ChevronDown,
  Check,
  GraduationCap,
  FileCheck2,
  History,
  X,
  Quote,
} from "lucide-react";
import {
  AUFGABEN_TYPEN_AKTIV,
  AUFGABEN_TYP_MAXIMUM,
  EXAM_GEEIGNETE_TYPEN,
  TEMPLATES,
  FARBMODI,
  Farbmodus,
  MUSTER_VARIANTEN,
  MusterVariante,
  WorksheetContent,
  ZIELDAUER_OPTIONEN_MINUTEN,
  KOMPLEXITAET_STUFEN,
  KOMPLEXITAET_LABEL,
  Komplexitaet,
  schaetzeAufgabenAnzahl,
  INHALTSQUELLEN,
  INHALTSQUELLE_LABEL,
  Inhaltsquelle,
  AUSGABEFORMEN,
  AUSGABEFORM_LABEL,
  Ausgabeform,
} from "@/lib/types";
import {
  THEMENBEREICHE,
  THEMENBEREICH_KEYS,
  ThemenbereichKey,
  SCHULSTUFEN_OPTIONEN,
  istFrueheVolksschulstufe,
  holeSchulstufenThemen,
} from "@/lib/curriculum";
import WorksheetView from "@/components/WorksheetView";
import IslamicPatternStrip from "@/components/IslamicPatternStrip";
import ToggleSwitch from "@/components/ToggleSwitch";
import SectionCard from "@/components/SectionCard";
import GenerierungLoading from "@/components/GenerierungLoading";
import { inputClass, labelClass } from "@/lib/formStyles";
import { MUSTER_LABEL } from "@/lib/patternStrip";
import { SEKTION_FARBEN } from "@/lib/sectionFarben";
import { MAX_VERSE_PRO_ABFRAGE, type SurahMeta } from "@/lib/quranApi";

/** Neutraler Grundstil für auswählbare Chips/Pills - Farbe kommt erst im aktiven Zustand dazu
 * (siehe SEKTION_FARBEN), damit nicht der ganze Screen bunt wirkt. */
const CHIP_BASIS = "border-slate-200 text-slate-500 hover:border-slate-300";

const ANDERE_SCHULSTUFE = "__andere__";

/** Ein geprüfter Hadith-Zitat-Eintrag aus der Wissensbasis (siehe app/api/hadithe/route.ts,
 * lib/wissensbasis.ts geprüfteHadithe) - eigener, schlanker Typ statt ZitatInhalt direkt zu
 * importieren, damit dieses Formular nicht von lib/wissensbasis.ts (Prisma-Zugriff) abhängen muss. */
interface HadithMeta {
  id: string;
  themenbereich: string;
  sammlung: string;
  bezeichnung: string;
  textVorschau?: string;
}

/** Sonderwert für den Sammlung-Filter im Hadith-Picker (siehe unten) - zeigt alle Sammlungen statt
 * nur eine einzelne (z.B. "Nawawi 40", "Sahih al-Bukhari", siehe ermittleHadithSammlung in
 * lib/wissensbasis.ts). */
const ALLE_SAMMLUNGEN = "__alle__";

const VORSCHAU_INHALT: WorksheetContent = {
  titel: "Die 5 Säulen des Islam",
  fach: "Islamischer Religionsunterricht",
  schulstufe: "4. Klasse Volksschule",
  thema: "Die 5 Säulen des Islam",
  lernziel: "Die Schüler:innen können die fünf Säulen des Islam benennen und kurz erklären.",
  einleitung: "Der Islam beruht auf fünf Grundpfeilern, die das gläubige Leben prägen.",
  aufgaben: [
    {
      nr: 1,
      typ: "multiple_choice",
      frage: "Welche Aussage gehört zu den 5 Säulen?",
      optionen: [
        "Das Fasten im Ramadan",
        "Der wöchentliche Besuch der Freitagspredigt",
        "Das tägliche Rezitieren des gesamten Korans",
      ],
      anforderungsbereich: "afb1",
    },
    {
      nr: 2,
      typ: "zuordnung",
      frage: "Ordne die Begriffe ihrer Bedeutung zu.",
      zuordnungLinks: ["Sawm", "Zakat"],
      zuordnungRechts: ["Das Fasten", "Die Pflichtabgabe"],
      anforderungsbereich: "afb1",
    },
    {
      nr: 3,
      typ: "offene_frage",
      frage: "Warum ist die Zakat für die Gemeinschaft wichtig?",
      anforderungsbereich: "afb3",
    },
  ],
  loesungen: [
    { nr: 1, loesung: "Das Fasten im Ramadan" },
    { nr: 2, loesung: "Sawm - Das Fasten, Zakat - Die Pflichtabgabe" },
    { nr: 3, loesung: "Individuelle Antwort" },
  ],
  quellen: [{ bezeichnung: "Sure 2 (Al-Baqara), Vers 177", sicherheit: "gesichert" }],
};

const TYP_META: Record<(typeof AUFGABEN_TYPEN_AKTIV)[number], { label: string; icon: typeof CheckSquare }> = {
  multiple_choice: { label: "Multiple Choice", icon: CheckSquare },
  lueckentext: { label: "Lückentext", icon: PenLine },
  zuordnung: { label: "Zuordnung", icon: ArrowLeftRight },
  offene_frage: { label: "Offene Frage", icon: MessageSquareText },
  wahr_falsch: { label: "Wahr oder Falsch (mit Begründung)", icon: ToggleLeft },
  reihenfolge: { label: "Reihenfolge", icon: ListOrdered },
  lesetext: { label: "Lesetext", icon: BookOpenText },
  malaufgabe: { label: "Malaufgabe", icon: Palette },
  recherche_auftrag: { label: "Recherche-/Referat-Auftrag", icon: FileSearch },
  bewegungsaufgabe: { label: "Bewegungsaufgabe", icon: PersonStanding },
  sortierkarten: { label: "Sortierkarten", icon: LayoutGrid },
  nachspuruebung: { label: "Nachspurübung", icon: PenTool },
};

/** Für 1. Klasse Volksschule (noch nicht lese-/schreibkundig) besonders geeignete Typen -
 * bekommen im Formular IMMER einen grünen Marker (Punkt + Rahmenfarbe), unabhängig von der
 * gerade gewählten Schulstufe, damit sofort erkennbar ist, welche Methoden dafür gedacht sind
 * (siehe fruehEmpfohlen unten). Bewusst kein Ausblenden bei anderen Schulstufen mehr (siehe
 * GenerateRequestSchema-Kommentar in lib/types.ts) - nur eine visuelle Einordnungshilfe. */
const AUFGABEN_TYPEN_FRUEH_EMPFOHLEN: readonly (typeof AUFGABEN_TYPEN_AKTIV)[number][] = [
  "bewegungsaufgabe",
  "sortierkarten",
  "malaufgabe",
  "nachspuruebung",
];

const TEMPLATE_META: Record<(typeof TEMPLATES)[number], { label: string; swatch: string }> = {
  klassisch: { label: "Klassisch", swatch: "#9c7a2c" },
  modern: { label: "Modern", swatch: "#0f766e" },
  kompakt: { label: "Kompakt", swatch: "#64748b" },
};

/**
 * Zwischenspeicherung der Formulareingaben im Browser (localStorage) - real beobachtet: nach
 * einem fehlgeschlagenen Erstellen-Versuch war die Lehrkraft zur Übersicht gewechselt und beim
 * Zurückkommen war das Formular wieder auf die Standardwerte zurückgesprungen (Schulstufe
 * fälschlich neu gewählt, versehentlich ein zweites, ungewolltes Arbeitsblatt erzeugt). Der
 * Schnappschuss wird bewusst NUR beim tatsächlichen Abschicken angelegt (siehe handleSubmit),
 * nicht bei jedem Tippen - sonst würde das Wiederherstellen-Banner unten schon erscheinen, wenn
 * jemand nur kurz etwas eingetippt und die Seite ohne jeden Erstellen-Versuch wieder verlassen
 * hat. Pro Klasse (bzw. "allgemein" ohne Klassenkontext) ein eigener Entwurf, damit sich
 * Prüfungs- und normale Arbeitsblatt-Entwürfe nicht gegenseitig überschreiben.
 */
interface FormDraft {
  thema: string;
  schulstufeAuswahl: string;
  schulstufeFrei: string;
  zieldauerMinuten: (typeof ZIELDAUER_OPTIONEN_MINUTEN)[number];
  komplexitaet: Komplexitaet;
  aufgabentypen: string[];
  punkteGesamt: number;
  zusatzhinweise: string;
  themenbereich: ThemenbereichKey;
  inhaltsquelle: Inhaltsquelle;
  ausgabeform: Ausgabeform;
  koranSureNummer: number;
  koranGanzeSure: boolean;
  koranVonVers: number;
  koranBisVers: number;
  hadithEintragId: string;
  template: (typeof TEMPLATES)[number];
  schulname: string;
  schriftgroesse: "normal" | "gross";
  zeigeIslamischesDatum: boolean;
  zeigeMuster: boolean;
  musterVariante: MusterVariante;
  zeigeLernziel: boolean;
  farbmodus: Farbmodus;
  zeigeNamensfeld: boolean;
}

function entwurfSchluessel(klasseId?: string): string {
  return `lernwerk-entwurf-neues-arbeitsblatt-${klasseId ?? "allgemein"}`;
}

function ladeEntwurf(klasseId?: string): Partial<FormDraft> | null {
  try {
    const roh = localStorage.getItem(entwurfSchluessel(klasseId));
    return roh ? (JSON.parse(roh) as Partial<FormDraft>) : null;
  } catch {
    return null;
  }
}

function speichereEntwurf(klasseId: string | undefined, entwurf: FormDraft) {
  try {
    localStorage.setItem(entwurfSchluessel(klasseId), JSON.stringify(entwurf));
  } catch {
    // localStorage kann in seltenen Fällen nicht verfügbar sein (z.B. privater Modus mit
    // deaktiviertem Speicher) - die Zwischenspeicherung ist dann einfach nicht aktiv, kein Grund
    // die Eingabe selbst zu unterbrechen.
  }
}

function loescheEntwurf(klasseId?: string) {
  try {
    localStorage.removeItem(entwurfSchluessel(klasseId));
  } catch {
    // siehe speichereEntwurf
  }
}

/**
 * Prüfungs-Modus B (komplette Neu-Generierung als formelle Prüfung, siehe lib/generateWorksheet.ts
 * "istPruefung") läuft durch dieselbe Pipeline wie ein normales Arbeitsblatt, ist aber NUR aus dem
 * Kontext einer Klasse heraus erreichbar (siehe app/klassen/[id]/pruefung-generieren) - eine
 * Prüfung ohne Bezug dazu, was diese Klasse tatsächlich schon behandelt hat, ergibt inhaltlich
 * keinen Sinn. Deshalb hier kein Umschalter mehr: klasseId gesetzt → Prüfungs-Modus fest an,
 * sonst fest aus. Für den kontingentfreien Weg "aus bestehenden Blättern zusammenstellen" siehe
 * stattdessen app/klassen/[id]/pruefung-zusammenstellen (Modus A).
 */
export default function NewWorksheetForm({
  kannErstellen,
  klasseId,
  klasseName,
  initialSchulstufe,
  initialZusatzhinweise,
}: {
  kannErstellen: boolean;
  klasseId?: string;
  klasseName?: string;
  initialSchulstufe?: string;
  initialZusatzhinweise?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const istPruefung = Boolean(klasseId);

  // Kein Formularfeld mehr (siehe Design-Feedback) - die App ist ausschließlich für islamischen
  // Religionsunterricht gebaut, eine Eingabemöglichkeit dafür bot Lehrkräften nie eine sinnvolle
  // Entscheidung. Wert bleibt im System/Prompt/Dashboard unverändert, nur fest statt editierbar.
  const bereich = "Islamischer Religionsunterricht";
  const [thema, setThema] = useState("");
  const [schulstufeAuswahl, setSchulstufeAuswahl] = useState(
    initialSchulstufe && (SCHULSTUFEN_OPTIONEN as readonly string[]).includes(initialSchulstufe)
      ? initialSchulstufe
      : SCHULSTUFEN_OPTIONEN[0],
  );
  const [schulstufeFrei, setSchulstufeFrei] = useState("");
  const schulstufe = schulstufeAuswahl === ANDERE_SCHULSTUFE ? schulstufeFrei : schulstufeAuswahl;
  const schulstufenThemen = holeSchulstufenThemen(schulstufe);
  const [zieldauerMinuten, setZieldauerMinuten] = useState<(typeof ZIELDAUER_OPTIONEN_MINUTEN)[number]>(30);
  const [komplexitaet, setKomplexitaet] = useState<Komplexitaet>("mittel");
  const [aufgabentypen, setAufgabentypen] = useState<string[]>([
    "multiple_choice",
    "offene_frage",
  ]);
  const [punkteGesamt, setPunkteGesamt] = useState(30);
  const sichtbareTypen = istPruefung ? EXAM_GEEIGNETE_TYPEN : AUFGABEN_TYPEN_AKTIV;
  // Nur für die Empfehlungs-Hinweise unten (z.B. "Malaufgabe empfohlen") - blockiert keine
  // Auswahl mehr; alle Aufgabentypen bleiben unabhängig von der Schulstufe wählbar, die
  // Lehrkraft kennt ihre Klasse besser als eine grobe Schulstufen-Heuristik.
  const fruehStufe = istFrueheVolksschulstufe(schulstufe);
  // Gemeinsam von der "→ ca. N Aufgaben"-Anzeige und dem Warnhinweis unten genutzt (siehe dort):
  // wie viele Aufgaben bei aktueller Zieldauer/Komplexität insgesamt entstehen - eine Obergrenze
  // dafür, wie viele der ausgewählten Aufgabentypen im fertigen Blatt überhaupt vorkommen können.
  const geschaetzteAufgabenAnzahl = schaetzeAufgabenAnzahl(
    zieldauerMinuten,
    aufgabentypen as (typeof AUFGABEN_TYPEN_AKTIV)[number][],
    komplexitaet,
  );
  // Pro sichtbarem Aufgabentyp: würde ihn JETZT zusätzlich auszuwählen die bei aktueller
  // Zieldauer/Komplexität ohnehin schätzbare Aufgabenzahl übersteigen? Verhindert das vom
  // Betreiber beim Testen gefundene Szenario (12 Typen ausgewählt, nur 3-4 kamen im fertigen
  // Blatt tatsächlich vor) schon bei der Auswahl selbst, statt nur nachträglich zu warnen - siehe
  // toggleTyp (dieselbe Bedingung, dort als eigentliche Sperre) und den Hinweistext unten. Ändert
  // sich die Zieldauer NACH der Auswahl auf weniger, greift diese Vorab-Sperre nicht rückwirkend
  // (bereits gewählte Typen werden nie automatisch entfernt) - dafür bleibt der bestehende
  // Warnhinweis unten als sichtbarer Hinweis auf genau diesen Fall.
  const typenMitLimitInfo = sichtbareTypen.map((typ) => {
    const aktiv = aufgabentypen.includes(typ);
    const kandidat = aktiv ? aufgabentypen : [...aufgabentypen, typ];
    const geschaetztFuerKandidat = schaetzeAufgabenAnzahl(
      zieldauerMinuten,
      kandidat as (typeof AUFGABEN_TYPEN_AKTIV)[number][],
      komplexitaet,
    );
    return { typ, aktiv, limitErreicht: !aktiv && kandidat.length > geschaetztFuerKandidat };
  });
  const weitereTypenGesperrt = typenMitLimitInfo.some((t) => t.limitErreicht);
  const [zusatzhinweise, setZusatzhinweise] = useState(initialZusatzhinweise ?? "");
  const [themenbereich, setThemenbereich] = useState<ThemenbereichKey>("gemischt");
  const [themenvorschlaegeOffen, setThemenvorschlaegeOffen] = useState(false);
  const [themaIdeen, setThemaIdeen] = useState<string[] | null>(null);
  const [ideenLaden, setIdeenLaden] = useState(false);
  const [ideenFehler, setIdeenFehler] = useState<string | null>(null);
  const [ideenVerbleibend, setIdeenVerbleibend] = useState<number | null>(null);

  // Inhaltsquelle (siehe lib/types.ts INHALTSQUELLEN) - eigenständige erste Wahl, NICHT nur eine
  // Zusatzoption zu einem freien Thema: manche Lehrkräfte wollen gezielt einen Koran-Vers/eine
  // Sure bearbeiten, statt "irgendein Thema, das zufällig einen Koran-Bezug hat". Nur bei "koran"
  // relevant: ausgabeform steuert, ob daraus ein Arbeitsblatt mit KI-Aufgaben entsteht oder nur
  // der reine, live abgerufene Vers-Wortlaut zum Ausdrucken (kein Claude-Aufruf, kein
  // Kontingent-Verbrauch, siehe app/api/generate/route.ts). Bei einer Prüfung (istPruefung, aus
  // einem Klassen-Kontext heraus) bleibt bewusst nur "frei"/"arbeitsblatt" möglich - die
  // Auswahl-UI dafür wird dann gar nicht erst angezeigt (siehe unten).
  const [inhaltsquelle, setInhaltsquelle] = useState<Inhaltsquelle>("frei");
  const [ausgabeform, setAusgabeform] = useState<Ausgabeform>("arbeitsblatt");
  // Default Sure 1 (Al-Fatiha, 7 Verse) als sinnvoller, sofort "ganze Sure"-fähiger Startpunkt,
  // sobald die Liste geladen ist.
  const [suren, setSuren] = useState<SurahMeta[] | null>(null);
  const [surenLaden, setSurenLaden] = useState(false);
  const [surenFehler, setSurenFehler] = useState<string | null>(null);
  const [koranSureNummer, setKoranSureNummer] = useState(1);
  const [koranGanzeSure, setKoranGanzeSure] = useState(true);
  const [koranVonVers, setKoranVonVers] = useState(1);
  const [koranBisVers, setKoranBisVers] = useState(7);
  const ausgewaehlteSure = suren?.find((s) => s.nummer === koranSureNummer) ?? null;

  async function ladeSuren() {
    setSurenLaden(true);
    setSurenFehler(null);
    try {
      const res = await fetch("/api/koran/suren");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Suren-Liste konnte nicht geladen werden.");
      const liste = data.suren as SurahMeta[];
      setSuren(liste);
      const aktuelle = liste.find((s) => s.nummer === koranSureNummer);
      if (aktuelle) setKoranBisVers(Math.min(aktuelle.verseAnzahl, MAX_VERSE_PRO_ABFRAGE));
    } catch (err) {
      setSurenFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setSurenLaden(false);
    }
  }

  function onSureChange(nummer: number) {
    setKoranSureNummer(nummer);
    const meta = suren?.find((s) => s.nummer === nummer);
    if (!meta) return;
    setKoranVonVers(1);
    if (meta.verseAnzahl <= MAX_VERSE_PRO_ABFRAGE) {
      setKoranGanzeSure(true);
      setKoranBisVers(meta.verseAnzahl);
    } else {
      setKoranGanzeSure(false);
      setKoranBisVers(MAX_VERSE_PRO_ABFRAGE);
    }
  }

  // Suren-Liste erst laden, sobald sie tatsächlich gebraucht wird (Inhaltsquelle "koran"
  // gewählt) - nicht schon beim ersten Rendern des Formulars.
  useEffect(() => {
    if (inhaltsquelle === "koran" && !suren && !surenLaden) ladeSuren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inhaltsquelle]);

  const [hadithe, setHadithe] = useState<HadithMeta[] | null>(null);
  const [hadithLaden, setHadithLaden] = useState(false);
  const [hadithFehler, setHadithFehler] = useState<string | null>(null);
  const [hadithEintragId, setHadithEintragId] = useState("");
  // Textsuche + Sammlung-Filter (siehe HadithMeta/ALLE_SAMMLUNGEN oben) - mit der Zeit wachsen
  // die geprüften Hadithe auf mehrere Hundert (aktuell Nawawi 40, künftig auch Bukhari/Muslim),
  // eine reine Dropdown-Liste ohne Eingrenzung wäre dann nicht mehr brauchbar.
  const [hadithSuche, setHadithSuche] = useState("");
  const [hadithSammlungFilter, setHadithSammlungFilter] = useState(ALLE_SAMMLUNGEN);

  async function ladeHadithe() {
    setHadithLaden(true);
    setHadithFehler(null);
    try {
      const res = await fetch("/api/hadithe");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Hadith-Liste konnte nicht geladen werden.");
      const liste = data.hadithe as HadithMeta[];
      setHadithe(liste);
      if (!hadithEintragId && liste.length > 0) setHadithEintragId(liste[0].id);
    } catch (err) {
      setHadithFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setHadithLaden(false);
    }
  }

  // Hadith-Liste erst laden, sobald sie tatsächlich gebraucht wird (Inhaltsquelle "hadith"
  // gewählt) - analog zur Suren-Liste oben.
  useEffect(() => {
    if (inhaltsquelle === "hadith" && !hadithe && !hadithLaden) ladeHadithe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inhaltsquelle]);

  // Alle in der geladenen Liste tatsächlich vorkommenden Sammlungen, alphabetisch - Grundlage für
  // die Filter-Chips unten. Wird aus der ungefilterten Liste berechnet, damit ein einmal
  // ausgewählter Sammlung-Filter nicht durch die Textsuche wieder verschwindet.
  const hadithSammlungen = hadithe
    ? Array.from(new Set(hadithe.map((h) => h.sammlung))).sort((a, b) => a.localeCompare(b, "de"))
    : [];

  const gefilterteHadithe = (hadithe ?? []).filter((h) => {
    if (hadithSammlungFilter !== ALLE_SAMMLUNGEN && h.sammlung !== hadithSammlungFilter) return false;
    if (!hadithSuche.trim()) return true;
    const suche = hadithSuche.trim().toLowerCase();
    return h.bezeichnung.toLowerCase().includes(suche) || (h.textVorschau ?? "").toLowerCase().includes(suche);
  });

  // Hält die Auswahl konsistent mit dem gerade sichtbaren, gefilterten Ausschnitt - ohne das
  // würde bei einem Filterwechsel unbemerkt ein nicht mehr sichtbarer Hadith ausgewählt bleiben.
  useEffect(() => {
    if (!hadithe || gefilterteHadithe.length === 0) return;
    if (!gefilterteHadithe.some((h) => h.id === hadithEintragId)) {
      setHadithEintragId(gefilterteHadithe[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hadithSuche, hadithSammlungFilter, hadithe]);

  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]>("klassisch");
  const [schulname, setSchulname] = useState("");
  const [schriftgroesse, setSchriftgroesse] = useState<"normal" | "gross">("normal");
  const [zeigeIslamischesDatum, setZeigeIslamischesDatum] = useState(true);
  const [zeigeMuster, setZeigeMuster] = useState(true);
  const [musterVariante, setMusterVariante] = useState<MusterVariante>("sterne");
  const [zeigeLernziel, setZeigeLernziel] = useState(false);
  const [farbmodus, setFarbmodus] = useState<Farbmodus>("schwarzweiss");
  const [zeigeNamensfeld, setZeigeNamensfeld] = useState(true);

  // Gespeicherten Entwurf beim ersten Laden NUR erkennen, NICHT automatisch übernehmen (siehe
  // FormDraft oben) - bewusst sichtbar statt still im Hintergrund: die Lehrkraft entscheidet
  // per Klick, ob sie den vorherigen Stand zurückholt, statt dass Felder unbemerkt vorausgefüllt
  // erscheinen (das war beim automatischen Wiederherstellen die Sorge - man merkt nicht ohne
  // genaues Hinsehen, dass/was übernommen wurde).
  const [verfuegbarerEntwurf, setVerfuegbarerEntwurf] = useState<Partial<FormDraft> | null>(null);
  useEffect(() => {
    const entwurf = ladeEntwurf(klasseId);
    if (entwurf?.thema) setVerfuegbarerEntwurf(entwurf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Feldweise geprüft statt den ganzen Entwurf blind zu übernehmen - ein älterer, vor einer
  // Formular-Erweiterung gespeicherter Entwurf kann einzelne Felder fehlen haben.
  function entwurfUebernehmen() {
    const entwurf = verfuegbarerEntwurf;
    if (!entwurf) return;
    if (entwurf.thema !== undefined) setThema(entwurf.thema);
    if (entwurf.schulstufeAuswahl !== undefined) setSchulstufeAuswahl(entwurf.schulstufeAuswahl);
    if (entwurf.schulstufeFrei !== undefined) setSchulstufeFrei(entwurf.schulstufeFrei);
    // Zusätzliche Gültigkeitsprüfung (anders als bei den übrigen Feldern oben): ein VOR einer
    // Änderung von ZIELDAUER_OPTIONEN_MINUTEN gespeicherter Entwurf kann einen mittlerweile
    // ungültigen Wert enthalten (z.B. altes "35" nach Umstellung auf 20/30/40) - real beobachtet:
    // führte beim Abschicken zu "Ungültige Eingabe.", weil der wiederhergestellte Wert vom Server
    // (dieselbe Gültigkeitsliste) abgelehnt wurde, obwohl im Formular kein Fehler sichtbar war
    // (keine Zieldauer-Kachel erschien als ausgewählt). Bei ungültigem Wert bleibt einfach der
    // aktuelle Default stehen, statt einen kaputten Zustand zu übernehmen.
    if (
      entwurf.zieldauerMinuten !== undefined &&
      (ZIELDAUER_OPTIONEN_MINUTEN as readonly number[]).includes(entwurf.zieldauerMinuten)
    ) {
      setZieldauerMinuten(entwurf.zieldauerMinuten);
    }
    if (entwurf.komplexitaet !== undefined) setKomplexitaet(entwurf.komplexitaet);
    if (entwurf.aufgabentypen !== undefined) setAufgabentypen(entwurf.aufgabentypen);
    if (entwurf.punkteGesamt !== undefined) setPunkteGesamt(entwurf.punkteGesamt);
    if (entwurf.zusatzhinweise !== undefined) setZusatzhinweise(entwurf.zusatzhinweise);
    if (entwurf.themenbereich !== undefined) setThemenbereich(entwurf.themenbereich);
    if (entwurf.inhaltsquelle !== undefined) setInhaltsquelle(entwurf.inhaltsquelle);
    if (entwurf.ausgabeform !== undefined) setAusgabeform(entwurf.ausgabeform);
    if (entwurf.koranSureNummer !== undefined) setKoranSureNummer(entwurf.koranSureNummer);
    if (entwurf.koranGanzeSure !== undefined) setKoranGanzeSure(entwurf.koranGanzeSure);
    if (entwurf.koranVonVers !== undefined) setKoranVonVers(entwurf.koranVonVers);
    if (entwurf.koranBisVers !== undefined) setKoranBisVers(entwurf.koranBisVers);
    if (entwurf.hadithEintragId !== undefined) setHadithEintragId(entwurf.hadithEintragId);
    if (entwurf.template !== undefined) setTemplate(entwurf.template);
    if (entwurf.schulname !== undefined) setSchulname(entwurf.schulname);
    if (entwurf.schriftgroesse !== undefined) setSchriftgroesse(entwurf.schriftgroesse);
    if (entwurf.zeigeIslamischesDatum !== undefined) setZeigeIslamischesDatum(entwurf.zeigeIslamischesDatum);
    if (entwurf.zeigeMuster !== undefined) setZeigeMuster(entwurf.zeigeMuster);
    if (entwurf.musterVariante !== undefined) setMusterVariante(entwurf.musterVariante);
    if (entwurf.zeigeLernziel !== undefined) setZeigeLernziel(entwurf.zeigeLernziel);
    if (entwurf.farbmodus !== undefined) setFarbmodus(entwurf.farbmodus);
    if (entwurf.zeigeNamensfeld !== undefined) setZeigeNamensfeld(entwurf.zeigeNamensfeld);
    setVerfuegbarerEntwurf(null);
  }

  function entwurfVerwerfen() {
    loescheEntwurf(klasseId);
    setVerfuegbarerEntwurf(null);
  }

  function toggleTyp(typ: string) {
    setAufgabentypen((prev) => {
      if (prev.includes(typ)) return prev.filter((t) => t !== typ);
      // Auswahl bleibt aus, wenn sie die bei aktueller Zieldauer/Komplexität geschätzte
      // Aufgabenzahl übersteigen würde - siehe typenMitLimitInfo oben (dieselbe Bedingung, dort
      // fürs Ausgrauen der Chips). Abwählen ist immer möglich, nur das Hinzufügen kann blockiert
      // sein.
      const kandidat = [...prev, typ];
      const geschaetzt = schaetzeAufgabenAnzahl(
        zieldauerMinuten,
        kandidat as (typeof AUFGABEN_TYPEN_AKTIV)[number][],
        komplexitaet,
      );
      if (kandidat.length > geschaetzt) return prev;
      return kandidat;
    });
  }

  async function ideenVorschlagen() {
    setIdeenLaden(true);
    setIdeenFehler(null);
    try {
      const res = await fetch("/api/thema-ideen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schulstufe, themenbereich }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Ideen konnten nicht erstellt werden.");
      setThemaIdeen(Array.isArray(data.ideen) ? data.ideen : []);
      setIdeenVerbleibend(typeof data.verbleibend === "number" ? data.verbleibend : null);
    } catch (err) {
      setIdeenFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setIdeenLaden(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (ausgabeform === "arbeitsblatt" && aufgabentypen.length === 0) {
      setError("Bitte mindestens einen Aufgabentyp auswählen.");
      return;
    }
    if (inhaltsquelle === "koran" && koranBisVers - koranVonVers + 1 > MAX_VERSE_PRO_ABFRAGE) {
      setError(`Bitte höchstens ${MAX_VERSE_PRO_ABFRAGE} Verse auswählen.`);
      return;
    }
    if (inhaltsquelle === "hadith" && !hadithEintragId) {
      setError("Bitte einen Hadith aus der Wissensbasis auswählen.");
      return;
    }

    // Entwurf-Schnappschuss GENAU in dem Moment, in dem tatsächlich ein Versuch gestartet wird -
    // nicht schon bei jedem Tippen (siehe FormDraft oben): das Wiederherstellen-Banner soll nur
    // erscheinen, wenn ein Versuch wirklich nicht durchgelaufen ist, nicht schon weil jemand nur
    // kurz etwas eingetippt und die Seite wieder verlassen hat, ohne überhaupt abzusenden.
    speichereEntwurf(klasseId, {
      thema,
      schulstufeAuswahl,
      schulstufeFrei,
      zieldauerMinuten,
      komplexitaet,
      aufgabentypen,
      punkteGesamt,
      zusatzhinweise,
      themenbereich,
      inhaltsquelle,
      ausgabeform,
      koranSureNummer,
      koranGanzeSure,
      koranVonVers,
      koranBisVers,
      hadithEintragId,
      template,
      schulname,
      schriftgroesse,
      zeigeIslamischesDatum,
      zeigeMuster,
      musterVariante,
      zeigeLernziel,
      farbmodus,
      zeigeNamensfeld,
    });

    setLoading(true);
    try {
      let res: Response;
      try {
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bereich,
            thema: inhaltsquelle === "frei" ? thema : undefined,
            schulstufe,
            themenbereich,
            zieldauerMinuten,
            komplexitaet,
            aufgabentypen: ausgabeform === "arbeitsblatt" ? aufgabentypen : undefined,
            istPruefung,
            punkteGesamt: istPruefung ? punkteGesamt : undefined,
            klasseId,
            inhaltsquelle,
            ausgabeform,
            koranFokus:
              inhaltsquelle === "koran"
                ? { sureNummer: koranSureNummer, vonVers: koranVonVers, bisVers: koranBisVers }
                : undefined,
            hadithFokus: inhaltsquelle === "hadith" ? { wissensEintragId: hadithEintragId } : undefined,
            zusatzhinweise: zusatzhinweise || undefined,
            layout: {
              template,
              schulname: schulname || undefined,
              schriftgroesse,
              zeigeIslamischesDatum,
              zeigeMuster,
              musterVariante,
              zeigeLernziel,
              farbmodus,
              zeigeNamensfeld,
            },
          }),
        });
      } catch {
        // fetch() selbst schlägt fehl (kein res!), z.B. bei "Load failed"/"Failed to fetch" -
        // Verbindungsabbruch mitten in der (bei langer Zieldauer/vielen Aufgabentypen bzw. Koran-
        // Fokus durchaus minutenlangen) Anfrage, etwa durch schwaches Mobilfunknetz, gesperrten
        // Bildschirm oder eine in den Hintergrund gelegte Seite. Die Serverfunktion kann in diesem
        // Fall trotzdem fertig geworden sein (und dabei Kontingent verbraucht haben) - deshalb
        // NICHT einfach "erneut versuchen" vorschlagen, ohne vorher auf ein mögliches Duplikat
        // hinzuweisen.
        throw new Error(
          "Die Verbindung wurde während der Erstellung unterbrochen (z.B. schwaches Netz oder die Seite wurde in den Hintergrund gelegt). Bitte zuerst in der Übersicht nachsehen, ob das Arbeitsblatt trotzdem schon fertig wurde, bevor erneut versucht wird - sonst kann versehentlich ein zweites Mal Kontingent verbraucht werden.",
        );
      }

      const rohtext = await res.text();
      let data: { id?: string; error?: string };
      try {
        data = JSON.parse(rohtext);
      } catch {
        // Kein gültiges JSON (z.B. weil die Serverfunktion mitten in der Generierung wegen
        // Zeitüberschreitung abgebrochen wurde und stattdessen eine Plattform-Fehlerseite
        // zurückkam) - statt der kryptischen Browser-Fehlermeldung eine verständliche anzeigen.
        throw new Error(
          "Die Erstellung hat zu lange gedauert oder wurde serverseitig abgebrochen. Bitte erneut versuchen - ggf. mit weniger Aufgaben gleichzeitig.",
        );
      }
      if (!res.ok || !data.id) {
        throw new Error(data.error ?? "Generierung fehlgeschlagen.");
      }
      // Entwurf erst NACH erfolgreicher Erstellung löschen - bei jedem Fehlschlag (auch dem
      // Verbindungsabbruch oben) bleibt er bewusst erhalten.
      loescheEntwurf(klasseId);
      router.push(`/worksheet/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setLoading(false);
    }
  }

  const vorschauLayout = {
    template,
    schulname: schulname || undefined,
    schriftgroesse,
    zeigeIslamischesDatum,
    zeigeMuster,
    musterVariante,
    zeigeLernziel,
    farbmodus,
    zeigeNamensfeld,
  };

  // Dynamische Schrittanzeige (siehe SectionCard "schritt") - der Aufgaben-Schritt entfällt bei
  // ausgabeform "text" (reiner, live abgerufener Vers-Wortlaut ohne KI-Aufgaben), Layout rückt
  // dann von Schritt 3 auf Schritt 2.
  const zeigeAufgabenSchritt = ausgabeform === "arbeitsblatt";
  const gesamtSchritte = zeigeAufgabenSchritt ? 3 : 2;
  const layoutSchritt = zeigeAufgabenSchritt ? 3 : 2;

  // ausgabeform "text" braucht keinen Claude-Aufruf und zählt daher nicht zum Kontingent (siehe
  // app/api/generate/route.ts) - der Erstellen-Button bleibt in diesem Fall auch dann aktiv, wenn
  // das normale Kontingent (kannErstellen-Prop, von der Elternkomponente anhand des Kontingents
  // berechnet) aufgebraucht ist.
  const kannAbsenden = kannErstellen || ausgabeform === "text";

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        {verfuegbarerEntwurf && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
            <div className="flex items-center gap-2.5 text-sm text-brand-800">
              <History size={16} className="shrink-0" />
              <span>
                Vorheriger Entwurf gefunden: <strong>„{verfuegbarerEntwurf.thema}"</strong> - z.B.
                weil ein früherer Versuch nicht durchgelaufen ist.
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={entwurfUebernehmen}
                className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
              >
                Thema &amp; Aufgaben übernehmen
              </button>
              <button
                type="button"
                onClick={entwurfVerwerfen}
                title="Verwerfen"
                className="rounded-lg p-1.5 text-brand-700 transition hover:bg-brand-100"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <SectionCard
          icon={BookOpen}
          title="Inhalt"
          subtitle="Worum geht es, für wen"
          akzent="blau"
          schritt={{ nr: 1, von: gesamtSchritte }}
        >
          {!istPruefung && (
            <div className="mb-5">
              <span className={labelClass}>Wie möchtest du starten?</span>
              <div className="flex flex-wrap gap-2">
                {INHALTSQUELLEN.map((quelle) => {
                  const active = inhaltsquelle === quelle;
                  return (
                    <button
                      type="button"
                      key={quelle}
                      onClick={() => setInhaltsquelle(quelle)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                        active ? SEKTION_FARBEN.blau.aktiv : CHIP_BASIS
                      }`}
                    >
                      {quelle === "koran" && <BookOpenText size={15} />}
                      {quelle === "hadith" && <Quote size={15} />}
                      {INHALTSQUELLE_LABEL[quelle]}
                    </button>
                  );
                })}
              </div>
              <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                {inhaltsquelle === "koran"
                  ? "Eine bestimmte Sure/Verse steht im Mittelpunkt - live abgerufener, garantiert korrekter Text."
                  : inhaltsquelle === "hadith"
                    ? "Ein bereits von einem Admin geprüftes Hadith-Zitat aus der Wissensbasis steht im Mittelpunkt."
                    : "Ein frei gewähltes Thema (z.B. „Die 5 Säulen des Islam“)."}
              </span>
            </div>
          )}
          <div className={`grid gap-4 ${inhaltsquelle === "frei" ? "sm:grid-cols-2" : ""}`}>
            {inhaltsquelle === "frei" && (
              <label className="block">
                <span className={labelClass}>Thema</span>
                <input
                  className={inputClass}
                  value={thema}
                  onChange={(e) => setThema(e.target.value)}
                  placeholder="z.B. Die 5 Säulen des Islam"
                  required
                />
                <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                  Je spezifischer (z.B. „Die 5 Säulen des Islam" statt nur „Islam"), desto besser
                  passen die Aufgaben.
                </span>
              </label>
            )}
            <label className="block">
              <span className={labelClass}>Schulstufe</span>
              <select
                className={inputClass}
                value={schulstufeAuswahl}
                onChange={(e) => setSchulstufeAuswahl(e.target.value)}
              >
                {SCHULSTUFEN_OPTIONEN.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value={ANDERE_SCHULSTUFE}>Andere (frei eingeben) …</option>
              </select>
              {schulstufeAuswahl === ANDERE_SCHULSTUFE && (
                <input
                  className={`${inputClass} mt-2`}
                  value={schulstufeFrei}
                  onChange={(e) => setSchulstufeFrei(e.target.value)}
                  placeholder="z.B. 5. Klasse Mittelschule, jahrgangsgemischte Gruppe"
                  required
                />
              )}
              <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                Steuert Sprachniveau - bei 1. Klasse Volksschule werden automatisch besonders
                einfache, mündlich vorlesbare Aufgaben bevorzugt.
              </span>
            </label>
          </div>
          {inhaltsquelle === "frei" && schulstufenThemen && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setThemenvorschlaegeOffen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                <ChevronDown
                  size={14}
                  className={`shrink-0 transition-transform ${themenvorschlaegeOffen ? "rotate-180" : ""}`}
                />
                Themenvorschläge laut Lehrplan IRU NEU ({schulstufenThemen.length})
              </button>
              {themenvorschlaegeOffen && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {schulstufenThemen.map((vorschlag) => (
                    <button
                      type="button"
                      key={vorschlag}
                      onClick={() => setThema(vorschlag)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        thema === vorschlag ? SEKTION_FARBEN.blau.aktiv : CHIP_BASIS
                      }`}
                    >
                      {vorschlag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {inhaltsquelle === "frei" && (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">
                  Noch keine Idee für ein Thema?
                </span>
                <button
                  type="button"
                  onClick={ideenVorschlagen}
                  disabled={ideenLaden || ideenVerbleibend === 0}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-surface px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
                >
                  <Sparkles size={13} className={ideenLaden ? "animate-pulse" : ""} />
                  {ideenLaden ? "Ideen werden erstellt …" : "KI-Ideen vorschlagen"}
                </button>
              </div>
              {ideenFehler && <p className="mt-1.5 text-xs text-red-600">{ideenFehler}</p>}
              {themaIdeen && themaIdeen.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {themaIdeen.map((idee) => (
                    <button
                      type="button"
                      key={idee}
                      onClick={() => setThema(idee)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${
                        thema === idee ? SEKTION_FARBEN.blau.aktiv : CHIP_BASIS
                      }`}
                    >
                      <Sparkles size={11} />
                      {idee}
                    </button>
                  ))}
                </div>
              )}
              {ideenVerbleibend !== null && (
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {ideenVerbleibend > 0
                    ? `Noch ${ideenVerbleibend}× heute verfügbar.`
                    : "Tageslimit für Themenideen erreicht - morgen wieder verfügbar."}
                </p>
              )}
            </div>
          )}
          {inhaltsquelle === "koran" && (
            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs leading-relaxed text-slate-500">
                Der live abgerufene, garantiert korrekte Text (Arabisch + deutsche Übersetzung
                von Bubenheim &amp; Elyas) dieser Sure/dieser Verse steht im Mittelpunkt.
              </p>
              <div>
                <span className={labelClass}>Ausgabeform</span>
                <div className="flex flex-wrap gap-2">
                  {AUSGABEFORMEN.map((form) => (
                    <button
                      type="button"
                      key={form}
                      onClick={() => setAusgabeform(form)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                        ausgabeform === form ? SEKTION_FARBEN.blau.aktiv : CHIP_BASIS
                      }`}
                    >
                      {AUSGABEFORM_LABEL[form]}
                    </button>
                  ))}
                </div>
                <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                  {ausgabeform === "text"
                    ? "Nur der reine Vers-Wortlaut zum Ausdrucken - kein KI-Aufruf, kostet kein Kontingent."
                    : "Ein vollständiges Arbeitsblatt mit Methoden/Aufgaben rund um diesen Text - zählt wie gewohnt zum Kontingent."}
                </span>
              </div>
              {surenLaden && <p className="text-xs text-slate-400">Suren-Liste wird geladen …</p>}
              {surenFehler && (
                <p className="text-xs text-red-600">
                  {surenFehler}{" "}
                  <button type="button" onClick={ladeSuren} className="underline">
                    Erneut versuchen
                  </button>
                </p>
              )}
              {suren && (
                <>
                  <label className="block max-w-sm">
                    <span className={labelClass}>Sure</span>
                    <select
                      className={inputClass}
                      value={koranSureNummer}
                      onChange={(e) => onSureChange(Number(e.target.value))}
                    >
                      {suren.map((s) => (
                        <option key={s.nummer} value={s.nummer}>
                          {s.nummer}. {s.nameTransliteriert} ({s.verseAnzahl} Verse)
                        </option>
                      ))}
                    </select>
                  </label>
                  {ausgewaehlteSure && ausgewaehlteSure.verseAnzahl <= MAX_VERSE_PRO_ABFRAGE && (
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={koranGanzeSure}
                        onChange={(e) => {
                          setKoranGanzeSure(e.target.checked);
                          if (e.target.checked && ausgewaehlteSure) {
                            setKoranVonVers(1);
                            setKoranBisVers(ausgewaehlteSure.verseAnzahl);
                          }
                        }}
                      />
                      Ganze Sure verwenden ({ausgewaehlteSure.verseAnzahl} Verse)
                    </label>
                  )}
                  {ausgewaehlteSure && ausgewaehlteSure.verseAnzahl > MAX_VERSE_PRO_ABFRAGE && (
                    <p className="text-xs leading-relaxed text-amber-700">
                      Diese Sure hat {ausgewaehlteSure.verseAnzahl} Verse - bitte einen Ausschnitt
                      von höchstens {MAX_VERSE_PRO_ABFRAGE} Versen wählen.
                    </p>
                  )}
                  {(!koranGanzeSure || (ausgewaehlteSure?.verseAnzahl ?? 0) > MAX_VERSE_PRO_ABFRAGE) && (
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="block">
                        <span className={labelClass}>Vers von</span>
                        <input
                          type="number"
                          min={1}
                          max={ausgewaehlteSure?.verseAnzahl}
                          className={`${inputClass} w-24`}
                          value={koranVonVers}
                          onChange={(e) => setKoranVonVers(Math.max(1, Number(e.target.value) || 1))}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>bis</span>
                        <input
                          type="number"
                          min={koranVonVers}
                          max={ausgewaehlteSure?.verseAnzahl}
                          className={`${inputClass} w-24`}
                          value={koranBisVers}
                          onChange={(e) =>
                            setKoranBisVers(Math.max(koranVonVers, Number(e.target.value) || koranVonVers))
                          }
                        />
                      </label>
                    </div>
                  )}
                  {koranBisVers - koranVonVers + 1 > MAX_VERSE_PRO_ABFRAGE && (
                    <p className="text-xs text-red-600">
                      Höchstens {MAX_VERSE_PRO_ABFRAGE} Verse - bitte den Bereich verkleinern.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          {inhaltsquelle === "hadith" && (
            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs leading-relaxed text-slate-500">
                Ein bereits von einem Admin geprüftes Hadith-Zitat aus der Wissensbasis steht im
                Mittelpunkt.
              </p>
              <div>
                <span className={labelClass}>Ausgabeform</span>
                <div className="flex flex-wrap gap-2">
                  {AUSGABEFORMEN.map((form) => (
                    <button
                      type="button"
                      key={form}
                      onClick={() => setAusgabeform(form)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                        ausgabeform === form ? SEKTION_FARBEN.blau.aktiv : CHIP_BASIS
                      }`}
                    >
                      {AUSGABEFORM_LABEL[form]}
                    </button>
                  ))}
                </div>
                <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                  {ausgabeform === "text"
                    ? "Nur das reine Hadith-Zitat zum Ausdrucken - kein KI-Aufruf, kostet kein Kontingent."
                    : "Ein vollständiges Arbeitsblatt mit Methoden/Aufgaben rund um diesen Hadith - zählt wie gewohnt zum Kontingent."}
                </span>
              </div>
              {hadithLaden && <p className="text-xs text-slate-400">Hadith-Liste wird geladen …</p>}
              {hadithFehler && (
                <p className="text-xs text-red-600">
                  {hadithFehler}{" "}
                  <button type="button" onClick={ladeHadithe} className="underline">
                    Erneut versuchen
                  </button>
                </p>
              )}
              {hadithe && hadithe.length === 0 && (
                <p className="text-xs leading-relaxed text-slate-500">
                  Noch keine geprüften Hadithe in der Wissensbasis hinterlegt.
                </p>
              )}
              {hadithe && hadithe.length > 0 && (
                <>
                  <label className="block">
                    <span className={labelClass}>Suche</span>
                    <input
                      type="text"
                      className={inputClass}
                      value={hadithSuche}
                      onChange={(e) => setHadithSuche(e.target.value)}
                      placeholder="z.B. Absicht, Barmherzigkeit …"
                    />
                  </label>
                  {hadithSammlungen.length > 1 && (
                    <div>
                      <span className={labelClass}>Sammlung</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHadithSammlungFilter(ALLE_SAMMLUNGEN)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            hadithSammlungFilter === ALLE_SAMMLUNGEN ? SEKTION_FARBEN.blau.aktiv : CHIP_BASIS
                          }`}
                        >
                          Alle
                        </button>
                        {hadithSammlungen.map((sammlung) => (
                          <button
                            type="button"
                            key={sammlung}
                            onClick={() => setHadithSammlungFilter(sammlung)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              hadithSammlungFilter === sammlung ? SEKTION_FARBEN.blau.aktiv : CHIP_BASIS
                            }`}
                          >
                            {sammlung}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {gefilterteHadithe.length === 0 ? (
                    <p className="text-xs leading-relaxed text-slate-500">
                      Kein Hadith passt zur aktuellen Suche/Sammlung.
                    </p>
                  ) : (
                    <label className="block">
                      <span className={labelClass}>
                        Hadith ({gefilterteHadithe.length} von {hadithe.length})
                      </span>
                      <select
                        className={inputClass}
                        value={hadithEintragId}
                        onChange={(e) => setHadithEintragId(e.target.value)}
                      >
                        {gefilterteHadithe.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.bezeichnung}
                          </option>
                        ))}
                      </select>
                      {gefilterteHadithe.find((h) => h.id === hadithEintragId)?.textVorschau && (
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                          {gefilterteHadithe.find((h) => h.id === hadithEintragId)?.textVorschau}
                        </p>
                      )}
                    </label>
                  )}
                </>
              )}
            </div>
          )}
          {(inhaltsquelle === "frei" || ausgabeform === "arbeitsblatt") && (
            <label className="mt-4 block">
              <span className={labelClass}>Themenbereich (Grundkompetenz laut Lehrplan IRU NEU)</span>
              <p className="mb-1.5 text-xs leading-relaxed text-slate-400">
                Ordnet das oben angegebene Thema einer der sieben Grundkompetenzen des aktuellen
                Lehrplans zu - beeinflusst, welcher fachliche Schwerpunkt und welche Quellenarten
                bei der Prüfung erwartet werden. Unsicher? Einfach „Grundkompetenz passend zum
                Thema wählen" lassen.
              </p>
              <select
                className={inputClass}
                value={themenbereich}
                onChange={(e) => setThemenbereich(e.target.value as ThemenbereichKey)}
              >
                {THEMENBEREICH_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {THEMENBEREICHE[key].label}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                {THEMENBEREICHE[themenbereich].beschreibung}
              </span>
            </label>
          )}
          {ausgabeform === "arbeitsblatt" && (
            <label className="mt-4 block">
              <span className={labelClass}>Zusätzliche Hinweise (optional)</span>
              <textarea
                className={inputClass}
                rows={2}
                value={zusatzhinweise}
                onChange={(e) => setZusatzhinweise(e.target.value)}
                placeholder="z.B. Bezug zum Ramadan herstellen, einfache Sprache"
              />
            </label>
          )}
        </SectionCard>

        {zeigeAufgabenSchritt && (
        <SectionCard
          icon={ListChecks}
          title="Aufgaben"
          subtitle="Aufgabentypen, Umfang und Anspruch"
          akzent="gold"
          schritt={{ nr: 2, von: gesamtSchritte }}
        >
          {istPruefung && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800">
              <FileCheck2 size={16} className="mt-0.5 shrink-0" />
              <span>
                Prüfung für Klasse „{klasseName}" - formeller Ton, nur prüfungstaugliche
                Aufgabentypen, Punkte pro Aufgabe.
              </span>
            </div>
          )}
          {istPruefung && (
            <label className="mb-4 block max-w-xs">
              <span className={labelClass}>Zielpunktzahl</span>
              <input
                type="number"
                min={1}
                max={200}
                className={inputClass}
                value={punkteGesamt}
                onChange={(e) => setPunkteGesamt(Math.max(1, Number(e.target.value) || 1))}
              />
              <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                Die Punkte der einzelnen Aufgaben summieren sich auf diesen Wert.
              </span>
            </label>
          )}
          <span className={labelClass}>Aufgabentypen</span>
          <div className="flex flex-wrap gap-2">
            {typenMitLimitInfo.map(({ typ, aktiv: active, limitErreicht }) => {
              const meta = TYP_META[typ];
              const fruehEmpfohlen = AUFGABEN_TYPEN_FRUEH_EMPFOHLEN.includes(typ);
              return (
                <button
                  type="button"
                  key={typ}
                  onClick={() => toggleTyp(typ)}
                  disabled={limitErreicht}
                  aria-pressed={active}
                  title={
                    limitErreicht
                      ? `Bei dieser Zieldauer werden nur ca. ${geschaetzteAufgabenAnzahl} Aufgaben erstellt - dafür ist kein Platz mehr. Zieldauer erhöhen oder einen gewählten Typ abwählen.`
                      : fruehEmpfohlen
                        ? "Empfohlen für 1. Klasse Volksschule"
                        : undefined
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-gold-600 bg-gold-600 text-white shadow-sm shadow-gold-600/30"
                      : limitErreicht
                        ? "cursor-not-allowed border-slate-100 text-slate-300"
                        : fruehEmpfohlen
                          ? "border-brand-300 text-brand-700 hover:border-brand-400"
                          : CHIP_BASIS
                  }`}
                >
                  {active ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    fruehEmpfohlen && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    )
                  )}
                  <meta.icon size={14} strokeWidth={2.25} />
                  {meta.label}
                </button>
              );
            })}
          </div>
          {weitereTypenGesperrt && (
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Ausgegraute Typen sind bei dieser Zieldauer nicht mehr wählbar - bei ca.{" "}
              {geschaetzteAufgabenAnzahl} Aufgaben insgesamt ist kein Platz mehr für weitere
              Typen. Für mehr Auswahl die Zieldauer erhöhen oder einen gewählten Typ abwählen.
            </p>
          )}
          {!istPruefung && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              Empfohlen für 1. Klasse Volksschule (noch nicht lese-/schreibkundig)
            </p>
          )}
          <div className="mb-5 mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <span className={labelClass}>Zieldauer im Unterricht</span>
              <div className="flex flex-wrap gap-2">
                {ZIELDAUER_OPTIONEN_MINUTEN.map((minuten) => (
                  <button
                    type="button"
                    key={minuten}
                    onClick={() => setZieldauerMinuten(minuten)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      zieldauerMinuten === minuten ? SEKTION_FARBEN.gold.aktiv : CHIP_BASIS
                    }`}
                  >
                    {minuten} Min
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className={labelClass}>Komplexität</span>
              <div className="flex flex-wrap gap-2">
                {KOMPLEXITAET_STUFEN.map((stufe) => (
                  <button
                    type="button"
                    key={stufe}
                    onClick={() => setKomplexitaet(stufe)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      komplexitaet === stufe ? SEKTION_FARBEN.gold.aktiv : CHIP_BASIS
                    }`}
                  >
                    {KOMPLEXITAET_LABEL[stufe]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className={`-mt-2 mb-1 text-xs leading-relaxed ${SEKTION_FARBEN.gold.boxLabel}`}>
            {aufgabentypen.length > 0 ? (
              <>
                → ca.{" "}
                <strong>{geschaetzteAufgabenAnzahl} Aufgaben</strong>
              </>
            ) : (
              "Wähle oben mindestens einen Aufgabentyp, um eine Richtwert-Anzahl zu sehen."
            )}
          </p>
          {aufgabentypen.length > 0 && (
            <p className="mb-3 text-xs leading-relaxed text-slate-400">
              Richtwert für {zieldauerMinuten} Minuten - Aufgabenzahl statt fixer Stückzahl wählen
              ist hier bewusst nicht möglich, weil einzelne Typen sehr unterschiedlich lange
              dauern; Genauigkeit auf die Minute ist dabei nicht erreichbar, besonders bei „Offene
              Frage".
            </p>
          )}
          {aufgabentypen.length > geschaetzteAufgabenAnzahl && (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              Du hast {aufgabentypen.length} Aufgabentypen ausgewählt, aber bei dieser Zieldauer
              werden insgesamt nur ca. {geschaetzteAufgabenAnzahl} Aufgaben erstellt - nicht jeder
              ausgewählte Typ kommt zwangsläufig im fertigen Arbeitsblatt vor. Für eine höhere
              Trefferquote pro Typ entweder gezielter auswählen oder die Zieldauer erhöhen.
            </p>
          )}
          {aufgabentypen.some((typ) => typ in AUFGABEN_TYP_MAXIMUM) && (
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Hinweis: „Sortierkarten" und „Recherche-/Referat-Auftrag" sind für sich schon
              umfangreich - davon wird höchstens 1 Aufgabe pro Arbeitsblatt erstellt, auch wenn
              oben eine höhere Anzahl gewählt ist. Das fertige Blatt kann dadurch weniger
              Aufgaben enthalten als hier eingestellt.
            </p>
          )}
          {aufgabentypen.length > 2 && zieldauerMinuten === 40 && (
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs leading-relaxed text-slate-500">
              Viele verschiedene Aufgabentypen gleichzeitig + 40 Minuten Zieldauer kann die
              Erstellung etwas länger dauern lassen. Sollte sie in seltenen Fällen fehlschlagen,
              hilft meist ein erneuter Versuch, notfalls mit weniger Aufgabentypen gleichzeitig.
            </p>
          )}
          {aufgabentypen.includes("recherche_auftrag") && (
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs leading-relaxed text-slate-500">
              „Recherche-/Referat-Auftrag" eignet sich als längerfristige Projekt-/Hausaufgabe -
              nicht dafür gedacht, innerhalb einer einzelnen Unterrichtseinheit fertig zu werden.
            </p>
          )}
          {fruehStufe && !istPruefung && (
            <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3">
              <p className="text-xs leading-relaxed text-gold-700">
                Kinder der 1. Klasse Volksschule können meist noch nicht lesen/schreiben.
                Empfehlung: „Bewegungsaufgabe" (körperlich reagieren statt lesen), „Sortierkarten"
                (ausschneiden &amp; einordnen), „Malaufgabe" (selbst zeichnen) und „Nachspurübung"
                (Schreibmotorik) sowie ergänzend „Wahr oder Falsch", „Multiple Choice" und
                „Zuordnung" mit ganz kurzen, mündlich vorlesbaren Aufgaben.
              </p>
              <button
                type="button"
                onClick={() =>
                  setAufgabentypen([
                    "bewegungsaufgabe",
                    "sortierkarten",
                    "malaufgabe",
                    "nachspuruebung",
                  ])
                }
                className="shrink-0 whitespace-nowrap rounded-full border border-gold-300 bg-surface px-3 py-1.5 text-xs font-medium text-gold-700 transition hover:bg-gold-100"
              >
                Übernehmen
              </button>
            </div>
          )}
        </SectionCard>
        )}

        <SectionCard
          icon={LayoutTemplate}
          title="Layout"
          subtitle="So sieht das fertige Blatt aus"
          akzent="brand"
          schritt={{ nr: layoutSchritt, von: gesamtSchritte }}
        >
          <div className="mb-5 overflow-hidden rounded-xl border border-slate-200">
            <div className="h-[110px] overflow-hidden bg-slate-50">
              <div className="origin-top-left scale-[0.42]" style={{ width: "238%" }}>
                <WorksheetView
                  content={VORSCHAU_INHALT}
                  layout={vorschauLayout}
                  themenbereich={themenbereich}
                  erstelltAm={new Date()}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 border-t border-slate-200 bg-surface px-3 py-1.5 text-xs font-medium text-slate-400">
              <Eye size={12} />
              Live-Vorschau von Vorlage, Muster &amp; Druckfarbe
            </div>
          </div>
          <span className={labelClass}>Vorlage</span>
          <div className="mb-5 flex flex-wrap gap-2">
            {TEMPLATES.map((t) => {
              const meta = TEMPLATE_META[t];
              const active = template === t;
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                    active ? SEKTION_FARBEN.brand.aktiv : CHIP_BASIS
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: meta.swatch }}
                  />
                  {meta.label}
                </button>
              );
            })}
          </div>
          <span className={labelClass}>Druckfarbe</span>
          <div className="mb-5 flex flex-wrap gap-2">
            {FARBMODI.map((f) => {
              const active = farbmodus === f;
              return (
                <button
                  type="button"
                  key={f}
                  onClick={() => setFarbmodus(f)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                    active ? SEKTION_FARBEN.brand.aktiv : CHIP_BASIS
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-slate-300"
                    style={{ backgroundColor: f === "farbe" ? "#0e6b4a" : "#1a1a1a" }}
                  />
                  {f === "farbe" ? "Farbe" : "Schwarz-Weiß"}
                </button>
              );
            })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Schulname (optional, im Kopf)</span>
              <input
                className={inputClass}
                value={schulname}
                onChange={(e) => setSchulname(e.target.value)}
                placeholder="z.B. Islamische Volksschule Wien"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Schriftgröße</span>
              <select
                className={inputClass}
                value={schriftgroesse}
                onChange={(e) => setSchriftgroesse(e.target.value as "normal" | "gross")}
              >
                <option value="normal">Normal</option>
                <option value="gross">Groß</option>
              </select>
            </label>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            Lösungen erscheinen immer auf einem separaten Blatt bzw. Dokumentabschnitt, nie auf
            dem Arbeitsblatt selbst.
          </p>
          <div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/60 px-4">
            <ToggleSwitch
              checked={zeigeIslamischesDatum}
              onChange={setZeigeIslamischesDatum}
              label="Datum im Kopfbereich anzeigen (gregorianisch + Hijri)"
              description="Nur sinnvoll, wenn am Drucktag ausgeteilt wird - sonst bekommt der Schüler stattdessen ein Datumsfeld zum Selbst-Ausfüllen"
            />
            <ToggleSwitch
              checked={zeigeMuster}
              onChange={setZeigeMuster}
              label="Islamisches Ornament-Muster anzeigen"
              description="Dezenter Zierstreifen im Kopfbereich"
            />
            <ToggleSwitch
              checked={zeigeLernziel}
              onChange={setZeigeLernziel}
              label="Lernziel-Abschnitt auf dem Arbeitsblatt anzeigen"
              description="Standardmäßig aus – nur einblenden, wenn gewünscht"
            />
            <ToggleSwitch
              checked={zeigeNamensfeld}
              onChange={setZeigeNamensfeld}
              label="Namensfeld (Name / Klasse / Datum) anzeigen"
              description="Zum Ausfüllen von Hand - abschaltbar, wenn nicht an einzelne Schüler:innen ausgeteilt wird"
            />
          </div>
          {zeigeMuster && (
            <div className="mt-4">
              <span className={labelClass}>Musterauswahl</span>
              <div className="grid grid-cols-2 gap-2">
                {MUSTER_VARIANTEN.map((v) => {
                  const active = musterVariante === v;
                  return (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setMusterVariante(v)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 transition ${
                        active ? "border-brand-600 bg-brand-50" : CHIP_BASIS
                      }`}
                    >
                      <div className="flex h-5 w-full items-center justify-center overflow-hidden">
                        <IslamicPatternStrip variante={v} hoehe={20} />
                      </div>
                      <span
                        className={`text-xs font-medium ${active ? "text-brand-700" : "text-slate-500"}`}
                      >
                        {MUSTER_LABEL[v]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <GenerierungLoading />
        ) : (
          <button
            type="submit"
            disabled={!kannAbsenden}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3.5 font-medium text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
          >
            <Wand2 size={18} strokeWidth={2.25} />
            {kannAbsenden
              ? istPruefung
                ? "Prüfung erstellen"
                : ausgabeform === "text"
                  ? "Text erstellen"
                  : "Arbeitsblatt erstellen"
              : "Kontingent aufgebraucht"}
          </button>
        )}
      </form>

      <aside className="hidden md:block">
        <div className="sticky top-24">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <Eye size={14} />
            Live-Vorschau des Layouts (Beispiel-Inhalt)
          </div>
          <div className="max-h-[80vh] overflow-y-auto rounded-2xl shadow-card">
            <WorksheetView
              content={VORSCHAU_INHALT}
              layout={vorschauLayout}
              themenbereich={themenbereich}
              erstelltAm={new Date()}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
