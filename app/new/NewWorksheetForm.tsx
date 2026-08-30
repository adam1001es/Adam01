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
  Palette,
  Images,
  ListOrdered,
  BookOpenText,
  MessagesSquare,
  Grid3x3,
  Hash,
} from "lucide-react";
import {
  AUFGABEN_TYPEN,
  AUFGABEN_TYP_MAXIMUM,
  TEMPLATES,
  FARBMODI,
  Farbmodus,
  MUSTER_VARIANTEN,
  MusterVariante,
  WorksheetContent,
} from "@/lib/types";
import {
  THEMENBEREICHE,
  THEMENBEREICH_KEYS,
  ThemenbereichKey,
  SCHULSTUFEN_OPTIONEN,
  istFrueheVolksschulstufe,
} from "@/lib/curriculum";
import WorksheetView from "@/components/WorksheetView";
import IslamicPatternStrip from "@/components/IslamicPatternStrip";
import ToggleSwitch from "@/components/ToggleSwitch";
import SectionCard from "@/components/SectionCard";
import { inputClass, labelClass } from "@/lib/formStyles";
import { MUSTER_LABEL } from "@/lib/patternStrip";

const ANDERE_SCHULSTUFE = "__andere__";
const ANZAHL_OPTIONEN = [3, 4, 5, 6, 7, 8, 9, 10];

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
      typ: "lueckentext",
      frage: "Das Fasten im Ramadan heißt auf Arabisch ______.",
      wortliste: ["Sawm", "Zakat", "Hadsch"],
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
    { nr: 2, loesung: "Sawm" },
    { nr: 3, loesung: "Individuelle Antwort" },
  ],
  quellen: [{ bezeichnung: "Beispiel-Quelle", sicherheit: "gesichert" }],
};

const TYP_META: Record<(typeof AUFGABEN_TYPEN)[number], { label: string; icon: typeof CheckSquare }> = {
  multiple_choice: { label: "Multiple Choice", icon: CheckSquare },
  lueckentext: { label: "Lückentext", icon: PenLine },
  zuordnung: { label: "Zuordnung", icon: ArrowLeftRight },
  offene_frage: { label: "Offene Frage", icon: MessageSquareText },
  wahr_falsch: { label: "Wahr oder Falsch", icon: ToggleLeft },
  ausmalbild: { label: "Ausmalbild", icon: Palette },
  bildergeschichte: { label: "Bildergeschichte", icon: Images },
  reihenfolge: { label: "Reihenfolge", icon: ListOrdered },
  lesetext: { label: "Lesetext", icon: BookOpenText },
  diskussion: { label: "Diskussionsimpuls", icon: MessagesSquare },
  wortsuche: { label: "Wortsuche", icon: Grid3x3 },
  kreuzwortraetsel: { label: "Kreuzworträtsel", icon: Hash },
};

const TEMPLATE_META: Record<(typeof TEMPLATES)[number], { label: string; swatch: string }> = {
  klassisch: { label: "Klassisch", swatch: "#9c7a2c" },
  modern: { label: "Modern", swatch: "#12704c" },
  kompakt: { label: "Kompakt", swatch: "#64748b" },
};

export default function NewWorksheetForm({ kannErstellen }: { kannErstellen: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bereich, setBereich] = useState("Islamischer Religionsunterricht");
  const [thema, setThema] = useState("");
  const [schulstufeAuswahl, setSchulstufeAuswahl] = useState(SCHULSTUFEN_OPTIONEN[0]);
  const [schulstufeFrei, setSchulstufeFrei] = useState("");
  const schulstufe = schulstufeAuswahl === ANDERE_SCHULSTUFE ? schulstufeFrei : schulstufeAuswahl;
  const [anzahlAufgaben, setAnzahlAufgaben] = useState(6);
  const [aufgabentypen, setAufgabentypen] = useState<string[]>([
    "multiple_choice",
    "lueckentext",
    "offene_frage",
  ]);
  const [zusatzhinweise, setZusatzhinweise] = useState("");
  const [themenbereich, setThemenbereich] = useState<ThemenbereichKey>("gemischt");

  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]>("klassisch");
  const [schulname, setSchulname] = useState("");
  const [loesungenSeparat, setLoesungenSeparat] = useState(true);
  const [schriftgroesse, setSchriftgroesse] = useState<"normal" | "gross">("normal");
  const [zeigeIslamischesDatum, setZeigeIslamischesDatum] = useState(true);
  const [zeigeMuster, setZeigeMuster] = useState(true);
  const [musterVariante, setMusterVariante] = useState<MusterVariante>("sterne");
  const [zeigeLernziel, setZeigeLernziel] = useState(false);
  const [farbmodus, setFarbmodus] = useState<Farbmodus>("farbe");

  function toggleTyp(typ: string) {
    setAufgabentypen((prev) =>
      prev.includes(typ) ? prev.filter((t) => t !== typ) : [...prev, typ],
    );
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
          anzahlAufgaben,
          aufgabentypen,
          zusatzhinweise: zusatzhinweise || undefined,
          layout: {
            template,
            schulname: schulname || undefined,
            loesungenSeparat,
            schriftgroesse,
            zeigeIslamischesDatum,
            zeigeMuster,
            musterVariante,
            zeigeLernziel,
            farbmodus,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
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
    loesungenSeparat,
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
        <SectionCard icon={BookOpen} title="Inhalt" subtitle="Bereich, Thema, Schulstufe & Themenbereich" akzent="blau">
          <div className="mb-4 rounded-xl border-2 border-brand-300 bg-gradient-to-br from-brand-50 to-white p-4">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-600">
              Thema &amp; Schulstufe
            </span>
            <p className="mb-3 text-xs leading-relaxed text-slate-500">
              So entsteht der Inhalt: <strong className="text-slate-700">Thema</strong> bestimmt,
              worum es geht, <strong className="text-slate-700">Schulstufe</strong> steuert
              Sprachniveau und Aufgabenlänge, und weiter unten ordnet{" "}
              <strong className="text-slate-700">Themenbereich</strong> das Ganze fachlich dem
              Lehrplan zu. Je genauer diese drei Angaben, desto treffsicherer das Ergebnis.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Thema</span>
                <input
                  className="w-full rounded-lg border border-brand-300 bg-white px-4 py-3 text-base font-medium text-slate-800 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  value={thema}
                  onChange={(e) => setThema(e.target.value)}
                  placeholder="z.B. Die 5 Säulen des Islam"
                  required
                />
                <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                  Das konkrete Unterrichtsthema - je spezifischer (z.B. „Die 5 Säulen des Islam"
                  statt nur „Islam"), desto besser passen die Aufgaben.
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Schulstufe</span>
                <select
                  className="w-full rounded-lg border border-brand-300 bg-white px-4 py-3 text-base font-medium text-slate-800 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
                    className="mt-2 w-full rounded-lg border border-brand-300 bg-white px-4 py-3 text-base font-medium text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    value={schulstufeFrei}
                    onChange={(e) => setSchulstufeFrei(e.target.value)}
                    placeholder="z.B. 5. Klasse Mittelschule, jahrgangsgemischte Gruppe"
                    required
                  />
                )}
                <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                  Steuert Sprachniveau und Komplexität - bei 1./2. Klasse Volksschule werden
                  automatisch bildbasierte Aufgaben empfohlen.
                </span>
              </label>
            </div>
          </div>
          <label className="block">
            <span className={labelClass}>Bereich / Fach</span>
            <input
              className={inputClass}
              value={bereich}
              onChange={(e) => setBereich(e.target.value)}
              placeholder="z.B. Islamischer Religionsunterricht"
              required
            />
          </label>
          <label className="mt-4 block">
            <span className={labelClass}>Themenbereich (fachliche Einordnung laut Lehrplan)</span>
            <p className="mb-1.5 text-xs leading-relaxed text-slate-400">
              Ordnet das oben angegebene Thema fachlich einer der vier Lehrplan-Kategorien zu -
              beeinflusst, welcher fachliche Schwerpunkt und welche Quellenarten bei der Prüfung
              erwartet werden. Unsicher? Einfach „Themenbereich passend zum Thema wählen" lassen.
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

        <SectionCard icon={ListChecks} title="Aufgaben" subtitle="Umfang und Aufgabentypen" akzent="gold">
          <div className="mb-5">
            <span className={labelClass}>Anzahl Aufgaben</span>
            <div className="flex flex-wrap gap-2">
              {ANZAHL_OPTIONEN.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setAnzahlAufgaben(n)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition ${
                    anzahlAufgaben === n
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Wie viele sinnvoll sind, hängt von Thema und Schulstufe ab - für jüngere Klassen
              oder ausführlichere Aufgabentypen (z.B. offene Fragen) eher weniger wählen.
            </p>
          </div>
          <span className={labelClass}>Aufgabentypen</span>
          <div className="flex flex-wrap gap-2">
            {AUFGABEN_TYPEN.map((typ) => {
              const meta = TYP_META[typ];
              const active = aufgabentypen.includes(typ);
              return (
                <button
                  type="button"
                  key={typ}
                  onClick={() => toggleTyp(typ)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <meta.icon size={14} strokeWidth={2.25} />
                  {meta.label}
                </button>
              );
            })}
          </div>
          {aufgabentypen.some((typ) => typ in AUFGABEN_TYP_MAXIMUM) && (
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Hinweis: „Bildergeschichte", „Kreuzworträtsel" und „Wortsuche" sind für sich schon
              umfangreich - davon wird höchstens 1 Aufgabe pro Arbeitsblatt erstellt, auch wenn
              oben eine höhere Anzahl gewählt ist. Das fertige Blatt kann dadurch weniger Aufgaben
              enthalten als hier eingestellt.
            </p>
          )}
          {istFrueheVolksschulstufe(schulstufe) && (
            <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3">
              <p className="text-xs leading-relaxed text-gold-700">
                Kinder der 1./2. Klasse Volksschule können meist noch nicht lesen/schreiben.
                Empfehlung: überwiegend „Ausmalbild" und „Bildergeschichte" statt Lesetext-Aufgaben.
              </p>
              <button
                type="button"
                onClick={() => setAufgabentypen(["ausmalbild", "bildergeschichte"])}
                className="shrink-0 whitespace-nowrap rounded-full border border-gold-300 bg-white px-3 py-1.5 text-xs font-medium text-gold-700 transition hover:bg-gold-100"
              >
                Empfehlung übernehmen
              </button>
            </div>
          )}
        </SectionCard>

        <SectionCard icon={LayoutTemplate} title="Layout" subtitle="So sieht das fertige Blatt aus">
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
            <div className="flex items-center gap-1.5 border-t border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-400">
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
                    active
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
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
                    active
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
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
          <p className="mb-5 -mt-3 text-xs leading-relaxed text-slate-400">
            Schwarz-Weiß spart Toner/Tinte beim Ausdrucken in der Schule: farbiger Kopfbereich,
            Muster und Akzente werden durch schwarz/grau ersetzt.
          </p>
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
          <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/60 px-4">
            <ToggleSwitch
              checked={loesungenSeparat}
              onChange={setLoesungenSeparat}
              label="Lösungen auf separatem Blatt/Seite ausgeben"
            />
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
                        active
                          ? "border-brand-600 bg-brand-50"
                          : "border-slate-200 hover:border-slate-300"
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

        <button
          type="submit"
          disabled={loading || !kannErstellen}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3.5 font-medium text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
        >
          <Wand2 size={18} strokeWidth={2.25} />
          {loading
            ? "Wird erstellt und geprüft …"
            : kannErstellen
              ? "Arbeitsblatt erstellen"
              : "Kontingent aufgebraucht"}
        </button>
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
