import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  FileDown,
  GraduationCap,
  BookOpenCheck,
  Baby,
  CheckCircle2,
  XCircle,
  Gift,
  ArrowRight,
} from "lucide-react";
import { TIER_QUOTA, TIER_PREIS_EUR, KOSTENLOS_LIMIT } from "@/lib/quota";
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
    text: "Orientiert an der Grobstruktur des Lehrplans für islamischen Religionsunterricht (BGBl. II Nr. 234/2011) - Themenbereich und Schulstufen-Cluster fließen direkt in Sprache und Inhalt ein.",
    akzent: "brand",
  },
  {
    icon: Sparkles,
    titel: "Sekundenschnell druckfertig",
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
    titel: "Altersgerecht bis Klasse 1",
    text: "Für noch nicht lese-/schreibkundige Kinder automatisch besonders einfache, mündlich vorlesbare Aufgaben statt ungeeigneter Lesetext-Aufgaben.",
    akzent: "brand",
  },
] as const;

const FEATURE_BADGE = {
  brand: "bg-brand-50 text-brand-600",
  gold: "bg-gold-100 text-gold-700",
} as const;

const VERGLEICH_CHAT = [
  "Lehrplan, Kompetenzniveau und Quellenregeln musst du selbst formulieren - jedes Mal neu",
  "Du bekommst Fließtext, den du selbst in ein druckfertiges Arbeitsblatt bringen musst",
  "Niemand prüft die Antwort gegen - die fachliche Kontrolle bleibt komplett bei dir",
  "Kein Verlauf, keine Bibliothek deiner bisherigen Arbeitsblätter",
];

const VERGLEICH_UNS = [
  "IGGÖ-Lehrplan, Schulstufen-Cluster und Quellenregeln sind fest eingebaut",
  "Fertiges, layoutetes PDF/Word - direkt zum Ausdrucken, in Sekunden",
  "Ein zweiter, unabhängiger KI-Durchlauf prüft gezielt gegen, bevor du es siehst",
  "Alle erstellten Arbeitsblätter gespeichert, favorisierbar, jederzeit wieder abrufbar",
];

const WAS_ENTHALTEN = [
  "10 Aufgabentypen: Multiple Choice, Lückentext, Zuordnung, Reihenfolge, Kreuzworträtsel, Wortsuche, Diskussionsimpulse u.v.m.",
  "Speziell für die Kleinsten: automatisch besonders einfache, mündlich vorlesbare Aufgaben für Kinder, die noch nicht lesen/schreiben können",
  "Fertiges, druckreifes PDF oder Word-Dokument - direkt zum Ausdrucken",
  "Eine zweite, unabhängige KI-Prüfung für jedes einzelne Arbeitsblatt",
  "Eigene Bibliothek: alle bisher erstellten Arbeitsblätter jederzeit wieder abrufbar",
  "Wahlweise mit islamischem Datum und dezentem Ornament-Musterstreifen im Kopfbereich",
];

export default function LandingPage() {
  return (
    <main className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-center text-white shadow-card sm:px-12">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          Geprüfte, lehrplankonforme Arbeitsblätter für den
          <br className="hidden sm:block" /> islamischen Religionsunterricht - in Sekunden
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-brand-50">
          Nicht irgendein KI-Text: jedes Arbeitsblatt wird von einer zweiten, unabhängigen Prüfung
          gegengecheckt, ist am österreichischen IGGÖ-Lehrplan ausgerichtet und pädagogisch
          fundiert - fertig formatiert zum Ausdrucken.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-card transition hover:shadow-card-hover"
          >
            <Gift size={16} /> {KOSTENLOS_LIMIT} Arbeitsblätter/Monat kostenlos registrieren
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
            <h3 className="mb-4 font-display text-base font-semibold text-brand-800">
              Dieser Arbeitsblätter-Generator
            </h3>
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
          Der Funktionsumfang ist bei jeder Stufe derselbe - nur die Anzahl der Arbeitsblätter pro
          Monat unterscheidet sich.
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
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-center">
          <p className="text-sm leading-relaxed text-slate-500">
            <span className="font-medium text-slate-700">Wofür wird bezahlt? </span>
            Jedes erstellte und geprüfte Arbeitsblatt braucht echte KI-Rechenleistung - das Abo
            deckt genau diese Kosten sowie den laufenden Betrieb der Plattform, damit sie für die
            Lehrer:innen-Community dauerhaft kostendeckend weiterbestehen kann.
          </p>
        </div>

        <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <div className="text-sm font-semibold text-slate-700">Kostenlos</div>
            <div className="mt-1 text-xs text-slate-400">{KOSTENLOS_LIMIT} Arbeitsblätter/Monat</div>
          </div>
          <div className="rounded-xl border border-gold-200 bg-gold-50/40 p-4 text-center">
            <div className="text-sm font-semibold text-slate-700">
              Starter <span className="font-normal text-slate-400">· {TIER_PREIS_EUR.starter}€/Monat</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">{TIER_QUOTA.starter} Arbeitsblätter/Monat</div>
          </div>
          <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 text-center">
            <div className="text-sm font-semibold text-slate-700">
              Pro <span className="font-normal text-slate-400">· {TIER_PREIS_EUR.pro}€/Monat</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">{TIER_QUOTA.pro} Arbeitsblätter/Monat</div>
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
