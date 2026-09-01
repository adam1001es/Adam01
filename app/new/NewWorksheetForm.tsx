"use client";

import { useState } from "react";
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
  MessagesSquare,
  Grid3x3,
  Hash,
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

/** Neutraler Grundstil für auswählbare Chips/Pills - Farbe kommt erst im aktiven Zustand dazu
 * (siehe SEKTION_FARBEN), damit nicht der ganze Screen bunt wirkt. */
const CHIP_BASIS = "border-slate-200 text-slate-500 hover:border-slate-300";

const ANDERE_SCHULSTUFE = "__andere__";

const VORSCHAU_INHALT: WorksheetContent = {
  titel: "Beispiel: Die 5 Säulen des Islam",
  fach: "Islamischer Religionsunterricht",
  schulstufe: "4. Klasse Volksschule",
  thema: "Die 5 Säulen des Islam",
  lernziel: "Die Schüler:innen können die fünf Säulen des Islam benennen.",
  einleitung: "So könnte die Einleitung deines Arbeitsblatts aussehen.",
  aufgaben: [
    {
      nr: 1,
      typ: "multiple_choice",
      frage: "Welche Aussage gehört zu den 5 Säulen?",
      optionen: ["Das Fasten im Ramadan", "Das Feiern von Weihnachten", "Ein Beispiel-Text"],
      anforderungsbereich: "afb1",
    },
    {
      nr: 2,
      typ: "zuordnung",
      frage: "Ordne die Begriffe ihrer Bedeutung zu.",
      zuordnungLinks: ["Sawm", "Zakat"],
      zuordnungRechts: ["Das Fasten", "Die Armenabgabe"],
      anforderungsbereich: "afb1",
    },
    {
      nr: 3,
      typ: "offene_frage",
      frage: "So sieht eine offene Frage aus (z.B. mit eigener Begründung).",
      anforderungsbereich: "afb3",
    },
  ],
  loesungen: [
    { nr: 1, loesung: "Das Fasten im Ramadan" },
    { nr: 2, loesung: "Sawm - Das Fasten, Zakat - Die Armenabgabe" },
    { nr: 3, loesung: "Individuelle Antwort" },
  ],
  quellen: [{ bezeichnung: "Beispiel-Quelle", sicherheit: "gesichert" }],
};

const TYP_META: Record<(typeof AUFGABEN_TYPEN_AKTIV)[number], { label: string; icon: typeof CheckSquare }> = {
  multiple_choice: { label: "Multiple Choice", icon: CheckSquare },
  lueckentext: { label: "Lückentext", icon: PenLine },
  zuordnung: { label: "Zuordnung", icon: ArrowLeftRight },
  offene_frage: { label: "Offene Frage", icon: MessageSquareText },
  wahr_falsch: { label: "Wahr oder Falsch (mit Begründung)", icon: ToggleLeft },
  reihenfolge: { label: "Reihenfolge", icon: ListOrdered },
  lesetext: { label: "Lesetext", icon: BookOpenText },
  diskussion: { label: "Diskussionsimpuls", icon: MessagesSquare },
  wortsuche: { label: "Wortsuche", icon: Grid3x3 },
  kreuzwortraetsel: { label: "Kreuzworträtsel", icon: Hash },
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
  const [zieldauerMinuten, setZieldauerMinuten] = useState<(typeof ZIELDAUER_OPTIONEN_MINUTEN)[number]>(35);
  const [komplexitaet, setKomplexitaet] = useState<Komplexitaet>("mittel");
  const [aufgabentypen, setAufgabentypen] = useState<string[]>([
    "multiple_choice",
    "zuordnung",
    "offene_frage",
  ]);
  const [punkteGesamt, setPunkteGesamt] = useState(30);
  const sichtbareTypen = istPruefung ? EXAM_GEEIGNETE_TYPEN : AUFGABEN_TYPEN_AKTIV;
  // Nur für die Empfehlungs-Hinweise unten (z.B. "Malaufgabe empfohlen") - blockiert keine
  // Auswahl mehr; alle Aufgabentypen bleiben unabhängig von der Schulstufe wählbar, die
  // Lehrkraft kennt ihre Klasse besser als eine grobe Schulstufen-Heuristik.
  const fruehStufe = istFrueheVolksschulstufe(schulstufe);
  const [zusatzhinweise, setZusatzhinweise] = useState(initialZusatzhinweise ?? "");
  const [themenbereich, setThemenbereich] = useState<ThemenbereichKey>("gemischt");
  const [themenvorschlaegeOffen, setThemenvorschlaegeOffen] = useState(false);
  const [themaIdeen, setThemaIdeen] = useState<string[] | null>(null);
  const [ideenLaden, setIdeenLaden] = useState(false);
  const [ideenFehler, setIdeenFehler] = useState<string | null>(null);
  const [ideenVerbleibend, setIdeenVerbleibend] = useState<number | null>(null);

  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]>("klassisch");
  const [schulname, setSchulname] = useState("");
  const [schriftgroesse, setSchriftgroesse] = useState<"normal" | "gross">("normal");
  const [zeigeIslamischesDatum, setZeigeIslamischesDatum] = useState(true);
  const [zeigeMuster, setZeigeMuster] = useState(true);
  const [musterVariante, setMusterVariante] = useState<MusterVariante>("sterne");
  const [zeigeLernziel, setZeigeLernziel] = useState(false);
  const [farbmodus, setFarbmodus] = useState<Farbmodus>("schwarzweiss");

  function toggleTyp(typ: string) {
    setAufgabentypen((prev) =>
      prev.includes(typ) ? prev.filter((t) => t !== typ) : [...prev, typ],
    );
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

    if (aufgabentypen.length === 0) {
      setError("Bitte mindestens einen Aufgabentyp auswählen.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bereich,
          thema,
          schulstufe,
          themenbereich,
          zieldauerMinuten,
          komplexitaet,
          aufgabentypen,
          istPruefung,
          punkteGesamt: istPruefung ? punkteGesamt : undefined,
          klasseId,
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
          },
        }),
      });

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
  };

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard
          icon={BookOpen}
          title="Inhalt"
          subtitle="Worum geht es, für wen"
          akzent="blau"
          schritt={{ nr: 1, von: 3 }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
          {schulstufenThemen && (
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
        </SectionCard>

        <SectionCard
          icon={ListChecks}
          title="Aufgaben"
          subtitle="Aufgabentypen, Umfang und Anspruch"
          akzent="gold"
          schritt={{ nr: 2, von: 3 }}
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
            {sichtbareTypen.map((typ) => {
              const meta = TYP_META[typ];
              const active = aufgabentypen.includes(typ);
              const fruehEmpfohlen = AUFGABEN_TYPEN_FRUEH_EMPFOHLEN.includes(typ);
              return (
                <button
                  type="button"
                  key={typ}
                  onClick={() => toggleTyp(typ)}
                  aria-pressed={active}
                  title={fruehEmpfohlen ? "Empfohlen für 1. Klasse Volksschule" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-gold-600 bg-gold-600 text-white shadow-sm shadow-gold-600/30"
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
                <strong>
                  {schaetzeAufgabenAnzahl(
                    zieldauerMinuten,
                    aufgabentypen as (typeof AUFGABEN_TYPEN_AKTIV)[number][],
                    komplexitaet,
                  )}{" "}
                  Aufgaben
                </strong>
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
              Frage"/„Diskussion".
            </p>
          )}
          {aufgabentypen.some((typ) => typ in AUFGABEN_TYP_MAXIMUM) && (
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Hinweis: „Kreuzworträtsel", „Wortsuche", „Recherche-/Referat-Auftrag" und
              „Sortierkarten" sind für sich schon umfangreich - davon wird höchstens 1 Aufgabe
              pro Arbeitsblatt erstellt, auch wenn oben eine höhere Anzahl gewählt ist. Das
              fertige Blatt kann dadurch weniger Aufgaben enthalten als hier eingestellt.
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

        <SectionCard
          icon={LayoutTemplate}
          title="Layout"
          subtitle="So sieht das fertige Blatt aus"
          akzent="brand"
          schritt={{ nr: 3, von: 3 }}
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
            disabled={!kannErstellen}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3.5 font-medium text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
          >
            <Wand2 size={18} strokeWidth={2.25} />
            {kannErstellen
              ? istPruefung
                ? "Prüfung erstellen"
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
