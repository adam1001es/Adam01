import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  FileDown,
  GraduationCap,
  BookOpenCheck,
  Baby,
  FileSearch,
  CheckCircle2,
  XCircle,
  Gift,
  ArrowRight,
  Users,
  ClipboardList,
  BarChart3,
  LayoutGrid,
  FileCheck2,
  Lock,
} from "lucide-react";
import { TIER_QUOTA, TIER_PREIS_EUR, KOSTENLOS_LIMIT, formatEur } from "@/lib/quota";
import IslamicPatternStrip from "@/components/IslamicPatternStrip";

const FEATURES = [
  {
    icon: ShieldCheck,
    titel: "Zweite, unabhängige Prüfung",
    text: "Nicht nur generiert - ein separater KI-Durchlauf checkt jedes Arbeitsblatt gezielt gegen: Quellenangaben, Vollständigkeit, Altersgerechtigkeit, Kompetenzorientierung.",
    akzent: "brand",
  },
  {
    icon: GraduationCap,
    titel: "Pädagogisch fundiert",
    text: "Anforderungsbereiche (AFB I-III), anerkannte Kompetenzbereiche und kompetenzorientierte Lernziele sind fest eingebaut - bei jedem Arbeitsblatt, nicht nur wenn man daran denkt, es zu verlangen.",
    akzent: "gold",
  },
  {
    icon: BookOpenCheck,
    titel: "Für den österreichischen IGGÖ-Lehrplan",
    text: "Orientiert an der Grobstruktur des aktuellen Lehrplans für islamischen Religionsunterricht der IGGÖ („Lehrplan IRU NEU“) - Themenbereich und Schulstufen-Cluster fließen direkt in Sprache und Inhalt ein.",
    akzent: "brand",
  },
  {
    icon: Sparkles,
    titel: "Direkt druckfertig",
    text: "Kein Fließtext zum Selbst-Formatieren: fertiges, layoutetes PDF oder Word-Dokument, wahlweise mit islamischem Datum und Ornament-Musterstreifen.",
    akzent: "brand",
  },
  {
    icon: FileDown,
    titel: "Kontrollierte Quellendisziplin",
    text: "Koran- und Hadith-Angaben werden bewusst konservativ generiert, Hadithe nur aus Sahih al-Bukhari/Muslim (bevorzugt), Unsicheres wird als „bitte prüfen” markiert statt erfunden.",
    akzent: "gold",
  },
  {
    icon: Baby,
    titel: "Altersgerecht für die 1. Klasse",
    text: "Für noch nicht lese-/schreibkundige Kinder vier eigene Aufgabentypen: Bewegungsaufgabe (körperlich reagieren statt lesen), Sortierkarten (ausschneiden & einordnen), Malaufgabe (selbst zeichnen) und Nachspurübung (Schreibmotorik) - statt ungeeigneter Lesetext-Aufgaben.",
    akzent: "brand",
  },
  {
    icon: FileSearch,
    titel: "Recherche- und Referatsaufträge",
    text: "Ab der Sekundarstufe I: eigenständige Recherche-/Präsentationsaufgaben zu Personen, Orten oder Themen - mit Leitfaden, Bewertungskriterien und Quellenhinweis statt vager Freitext-Anweisung.",
    akzent: "gold",
  },
  {
    icon: BarChart3,
    titel: "Wissensstand auf einen Blick",
    text: "Jede Klasse zeigt Klassendurchschnitt, Abdeckung nach Grundkompetenz und die Entwicklung pro Schüler:in - automatisch aus den zugewiesenen Arbeitsblättern und eingetragenen Ergebnissen berechnet.",
    akzent: "klassen",
  },
  {
    icon: FileCheck2,
    titel: "Prüfungen in Minuten statt Stunden",
    text: "Aus bereits erstellten Arbeitsblättern eine formelle Prüfung zusammenstellen (punktegewichtet, ohne zusätzliches Kontingent) oder komplett neu generieren lassen - inklusive Punkteschema und AFB-Gewichtung.",
    akzent: "klassen",
  },
] as const;

const FEATURE_BADGE = {
  brand: "bg-brand-50 text-brand-600",
  gold: "bg-gold-100 text-gold-700",
  klassen: "bg-violet-100 text-violet-600",
} as const;

const VERGLEICH_CHAT = [
  "Lehrplan, Kompetenzniveau und Quellenregeln musst du selbst formulieren - jedes Mal neu",
  "Du bekommst Fließtext, den du selbst in ein druckfertiges Arbeitsblatt bringen musst - mit Recherche, Schreiben und Formatieren schnell 10-15+ Minuten",
  "Niemand prüft die Antwort gegen - die fachliche Kontrolle bleibt komplett bei dir",
  "Kein Verlauf, keine Bibliothek deiner bisherigen Arbeitsblätter",
  "Kein Überblick, welche Klasse welches Thema schon hatte oder wie sie dabei steht",
];

const VERGLEICH_UNS = [
  "IGGÖ-Lehrplan, Schulstufen-Cluster und Quellenregeln sind fest eingebaut",
  "Fertiges, layoutetes PDF/Word - direkt zum Ausdrucken, in 1-2 Minuten statt 10-15+",
  "Ein zweiter, unabhängiger KI-Durchlauf prüft gezielt gegen, bevor du es siehst",
  "Alle erstellten Arbeitsblätter gespeichert, favorisierbar, jederzeit wieder abrufbar",
  "Klassen, Wissensstand und Prüfungen direkt im selben Werkzeug - kein Zettelchaos",
];

const WAS_ENTHALTEN = [
  "Bewusst didaktisch bewährte Aufgabentypen statt Nonsens-Vielfalt: Multiple Choice, Lückentext, Zuordnung, Offene Frage, Wahr/Falsch mit Begründung, Reihenfolge, Lesetext, Diskussionsimpuls, Kreuzworträtsel, Wortsuche",
  "Speziell für die Kleinsten: Bewegungsaufgabe, Sortierkarten, Malaufgabe und Nachspurübung - vier Aufgabentypen ganz ohne Lese-/Schreibkompetenz für Kinder, die noch nicht lesen/schreiben können",
  "Ab Sekundarstufe I: Recherche-/Referatsaufträge mit Leitfaden, Bewertungskriterien und Quellenhinweis",
  "Fertiges, druckreifes PDF oder Word-Dokument - direkt zum Ausdrucken",
  "Eine zweite, unabhängige KI-Prüfung für jedes einzelne Arbeitsblatt",
  "Eigene Bibliothek: alle bisher erstellten Arbeitsblätter jederzeit wieder abrufbar",
  "Wahlweise mit islamischem Datum und dezentem Ornament-Musterstreifen im Kopfbereich",
];

const KLASSEN_PUNKTE = [
  {
    icon: Users,
    titel: "Klassen & pseudonyme Schüler-Kürzel",
    text: "Klassen anlegen, Schüler:innen nur mit Kürzel führen (z.B. „Schüler 1“) - bewusst ohne echte Namen, damit Datenschutz kein Thema ist.",
  },
  {
    icon: ClipboardList,
    titel: "Zuweisungen erfassen",
    text: "Welches Arbeitsblatt oder welche Prüfung hat welche Klasse wann bekommen - eigene Blätter, geteilte Community-Blätter oder manuell erfasste externe Materialien.",
  },
  {
    icon: BarChart3,
    titel: "Wissensstand automatisch berechnet",
    text: "Klassendurchschnitt, Abdeckung nach Grundkompetenz und Entwicklung pro Schüler:in - inklusive Noten-Richtwert nach gängigem österreichischem Schlüssel.",
  },
  {
    icon: LayoutGrid,
    titel: "Klassenzimmer-Ansicht",
    text: "Tafel und Schülertische von oben, jeder Tisch farbcodiert nach Notendurchschnitt - Klick auf einen Tisch öffnet ein animiertes Profil mit Prozent-Ring und Ergebnisverlauf.",
  },
  {
    icon: FileCheck2,
    titel: "Prüfungen zusammenstellen oder neu generieren",
    text: "Aus bereits geprüften Aufgaben eine Prüfung zusammenstellen (punktegewichtet, ohne zusätzliches Kontingent) - oder komplett neu generieren lassen, inklusive Punkteschema.",
  },
  {
    icon: ShieldCheck,
    titel: "Auch für Maturaklassen gedacht",
    text: "Formeller Prüfungston, AFB-II/III-Schwerpunkt statt reiner Reproduktion, nur prüfungstaugliche Aufgabenformate - für echte Wissensfeststellung, nicht nur Übung.",
  },
] as const;

export default function LandingPage() {
  return (
    <main className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-center text-white shadow-card sm:px-12">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold tracking-wide text-white ring-1 ring-inset ring-white/30">
          <Sparkles size={12} /> NEU: Klassen-Tracking, Wissensstand &amp; Prüfungsgenerierung
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
          Mehr als Arbeitsblätter: dein komplettes digitales Werkzeug für den
          <br className="hidden sm:block" /> islamischen Religionsunterricht
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-brand-50">
          KI-geprüfte, lehrplanorientierte Arbeitsblätter in 1-2 Minuten - plus Klassen-Tracking,
          Wissensstand auf einen Blick und Prüfungsgenerierung, die auch Maturaklassen ernst nimmt.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-card transition hover:shadow-card-hover"
          >
            <Gift size={16} /> {KOSTENLOS_LIMIT} Arbeitsblätter kostenlos ausprobieren
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Anmelden
          </Link>
        </div>
        <p className="mt-3 text-xs text-brand-50/80">
          Nur E-Mail + Passwort - in wenigen Minuten startklar.
        </p>
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <IslamicPatternStrip color="#f4ead1" opacity={0.55} hoehe={20} />
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-center font-display text-2xl font-semibold text-slate-800">
          Zwei Bereiche, ein Werkzeug
        </h2>
        <p className="mb-8 text-center text-sm text-slate-500">
          Arbeitsblätter erstellen - und den Überblick behalten, was am Ende bei den Schüler:innen
          ankommt.
        </p>
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          <div className="rounded-2xl bg-brand-gradient p-6 text-white shadow-card sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Sparkles size={20} strokeWidth={2} />
            </span>
            <h3 className="mt-3 font-display text-lg font-semibold">Arbeitsblätter</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-brand-50">
              KI-generiert, zweifach geprüft, lehrplanorientiert, fertig formatiert - für alle
              Schulstufen von der 1. Klasse Volksschule bis zur Matura.
            </p>
            <p className="mt-4 text-xs font-medium text-brand-50/90">
              Für alle Konten - {KOSTENLOS_LIMIT} kostenlos zum Ausprobieren
            </p>
          </div>
          <div className="rounded-2xl bg-klassen-gradient p-6 text-white shadow-card-klassen sm:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <GraduationCap size={20} strokeWidth={2} />
            </span>
            <h3 className="mt-3 font-display text-lg font-semibold">Klassen &amp; Prüfungen</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-violet-50">
              Klassen anlegen, Blätter/Prüfungen zuweisen, Wissensstand auf einen Blick sehen - bis
              hin zur animierten Klassenzimmer-Ansicht pro Schüler:in.
            </p>
            <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-violet-50/90">
              <Lock size={12} /> Enthalten im Abo
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, titel, text, akzent }) => (
          <div key={titel} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${FEATURE_BADGE[akzent]}`}>
              <Icon size={20} strokeWidth={2} />
            </span>
            <h2 className="mt-3 font-display text-lg font-semibold text-slate-800">{titel}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-klassen-gradient px-6 py-12 text-white shadow-card-klassen sm:px-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-inset ring-white/30">
            <Lock size={12} /> Nur im Abo freigeschaltet
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">
            Klassen, Wissensstand und Prüfungen - der Teil, der aus einem Generator ein echtes
            Unterrichtswerkzeug macht
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-violet-50 sm:text-base">
            Jede:r kann hier sehen, was Lernwerk kann - nutzbar ist der Bereich mit einem Abo.
            Besonders gedacht auch für Lehrkräfte, die Maturaklassen betreuen und echte
            Wissensfeststellung brauchen, nicht nur Übungsblätter.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KLASSEN_PUNKTE.map(({ icon: Icon, titel, text }) => (
              <div key={titel} className="rounded-2xl bg-white/10 p-5 ring-1 ring-inset ring-white/15">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <h3 className="mt-3 font-display text-sm font-semibold">{titel}</h3>
                <p className="mt-1 text-xs leading-relaxed text-violet-50/90">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-white/95 p-5 text-slate-700 shadow-card sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-violet-600">
              Beispielhafte Darstellung - Klassenzimmer-Ansicht
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[
                { kuerzel: "S1", prozent: 90, farbe: "#1e8c60" },
                { kuerzel: "S2", prozent: 95, farbe: "#1e8c60" },
                { kuerzel: "S3", prozent: 68, farbe: "#c9a04a" },
                { kuerzel: "S4", prozent: 48, farbe: "#f97316" },
                { kuerzel: "S5", prozent: 28, farbe: "#ef4444" },
                { kuerzel: "S6", prozent: 78, farbe: "#4fb384" },
              ].map((s) => (
                <div
                  key={s.kuerzel}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-[#d9c7a3] bg-gradient-to-b from-[#ecdbb9] to-[#d9c093] p-3"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2 ring-white"
                    style={{ backgroundColor: s.farbe }}
                  >
                    {s.kuerzel}
                  </span>
                  <span className="text-[10px] text-slate-500">{s.prozent}%</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Frei erfundene Beispieldaten zur Veranschaulichung - Klick auf einen Tisch öffnet in
              der echten Ansicht ein animiertes Profil mit Prozent-Ring und Ergebnisverlauf.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-center font-display text-2xl font-semibold text-slate-800">
          "Kann ich nicht einfach meine KI-App fragen?"
        </h2>
        <p className="mb-8 text-center text-sm text-slate-500">
          Kannst du - der Unterschied ist, was danach noch an dir hängen bleibt.
        </p>
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="mb-4 font-display text-base font-semibold text-slate-500">
              Normaler KI-Chat
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              {VERGLEICH_CHAT.map((punkt) => (
                <li key={punkt} className="flex items-start gap-2.5">
                  <XCircle size={16} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>{punkt}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-brand-300 bg-brand-50 p-6">
            <h3 className="mb-4 font-display text-base font-semibold text-brand-800">Lernwerk</h3>
            <ul className="space-y-3 text-sm text-brand-900">
              {VERGLEICH_UNS.map((punkt) => (
                <li key={punkt} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>{punkt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-8 text-center font-display text-2xl font-semibold text-slate-800">
          In drei Schritten fertig
        </h2>
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            { schritt: "1", titel: "Vorgeben", text: "Bereich, Thema, Schulstufe und Layout auswählen.", gold: false },
            { schritt: "2", titel: "Prüfen lassen", text: "KI erstellt den Inhalt, eine zweite KI prüft ihn unabhängig gegen.", gold: true },
            { schritt: "3", titel: "Drucken", text: "Fertiges PDF oder Word direkt herunterladen und austeilen.", gold: false },
          ].map(({ schritt, titel, text, gold }, i, arr) => (
            <div key={schritt} className="relative flex flex-col items-center text-center">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-semibold shadow-card ${
                  gold ? "bg-gold-400 text-gold-700" : "bg-brand-gradient text-white"
                }`}
              >
                {schritt}
              </span>
              <h3 className="mt-3 font-display text-base font-semibold text-slate-800">{titel}</h3>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
              {i < arr.length - 1 && (
                <ArrowRight
                  size={18}
                  className="absolute -right-2 top-3 hidden text-slate-300 sm:block"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-center font-display text-2xl font-semibold text-slate-800">
          Was du bekommst
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          Aufgabentypen, Prüfung und Formate sind bei jeder Stufe identisch - der Unterschied ist
          die Anzahl der Arbeitsblätter ({KOSTENLOS_LIMIT} einmalig zum Ausprobieren vs.{" "}
          {TIER_QUOTA.pro}/Monat im Abo) sowie der Zugang zur Community und zu Klassen-Tracking/
          Prüfungsgenerierung, die Abo-Konten vorbehalten sind.
        </p>
        <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
          {WAS_ENTHALTEN.map((punkt) => (
            <div
              key={punkt}
              className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-card"
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-500" />
              <span>{punkt}</span>
            </div>
          ))}
          <div className="flex items-start gap-2.5 rounded-xl border border-violet-200 bg-violet-50/60 p-4 text-sm text-violet-900 shadow-card-klassen sm:col-span-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-violet-600" />
            <span>
              Nur im Abo: Klassen-Tracking, Wissensstand-Auswertung, Klassenzimmer-Ansicht und
              Prüfungsgenerierung (Zusammenstellen aus bestehenden Blättern oder komplett neu)
            </span>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-center">
          <p className="text-sm leading-relaxed text-slate-500">
            <span className="font-medium text-slate-700">Wofür wird bezahlt? </span>
            Jedes erstellte und geprüfte Arbeitsblatt braucht echte KI-Rechenleistung - das Abo
            deckt genau diese Kosten sowie den laufenden Betrieb der Plattform, damit sie für die
            Lehrer:innen-Community dauerhaft kostendeckend weiterbestehen kann.
          </p>
        </div>

        <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <div className="text-sm font-semibold text-slate-700">Kostenlos</div>
            <div className="mt-1 text-xs text-slate-400">
              {KOSTENLOS_LIMIT} Arbeitsblätter insgesamt, einmalig
            </div>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 text-center">
            <div className="text-sm font-semibold text-slate-700">
              Abo <span className="font-normal text-slate-400">· {formatEur(TIER_PREIS_EUR.pro)}€/Monat</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {TIER_QUOTA.pro} Arbeitsblätter/Monat · inkl. Community, Klassen &amp; Prüfungen
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Die Freischaltung einer bezahlten Stufe erfolgt manuell - kontaktiere dazu einfach die
          Person, die den Zugang für deine Schule/Einrichtung verwaltet.
        </p>
      </section>
    </main>
  );
}
