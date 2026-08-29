import Link from "next/link";
import { Sparkles, ShieldCheck, FileDown, CalendarDays, CheckCircle2, Gift } from "lucide-react";
import { TIER_QUOTA, TIER_PREIS_EUR } from "@/lib/quota";
import { TRIAL_LIMIT } from "@/lib/trial";

const FEATURES = [
  {
    icon: Sparkles,
    titel: "KI-generiert & geprüft",
    text: "Claude erstellt jedes Arbeitsblatt und ein zweiter, unabhängiger Prüf-Durchlauf checkt Inhalt, Quellenangaben und Altersgerechtigkeit gegen.",
  },
  {
    icon: ShieldCheck,
    titel: "Lehrplan-verankert",
    text: "Orientiert an der Grobstruktur des österreichischen IGGÖ-Lehrplans (BGBl. II Nr. 234/2011), Hadithe nur aus anerkannten Sammlungen.",
  },
  {
    icon: CalendarDays,
    titel: "Islamisches Datum & Ornamentik",
    text: "Optionales Hijri-Datum im Kopfbereich und dezente Girih-Musterstreifen im klassischen Stil.",
  },
  {
    icon: FileDown,
    titel: "PDF- & Word-Export",
    text: "Fertige Arbeitsblätter direkt als PDF oder .docx herunterladen und ausdrucken.",
  },
];

export default function LandingPage() {
  return (
    <main className="space-y-14">
      <section className="overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-center text-white shadow-card sm:px-12">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          Arbeitsblätter für den islamischen Religionsunterricht –
          <br className="hidden sm:block" /> automatisch erstellt und geprüft
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-brand-50">
          Bereich, Thema, Schulstufe und Layout vorgeben – der Rest geht automatisch. In wenigen
          Sekunden fertig zum Ausdrucken.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/new"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-card transition hover:shadow-card-hover"
          >
            <Gift size={16} /> {TRIAL_LIMIT} Arbeitsblätter kostenlos testen
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Registrieren
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Anmelden
          </Link>
        </div>
        <p className="mt-3 text-xs text-brand-50/80">Kein Konto, keine Kreditkarte nötig zum Ausprobieren.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, titel, text }) => (
          <div
            key={titel}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon size={20} strokeWidth={2} />
            </span>
            <h2 className="mt-3 font-display text-lg font-semibold text-slate-800">{titel}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-1 text-center font-display text-2xl font-semibold text-slate-800">
          Zugang
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          {TRIAL_LIMIT} Arbeitsblätter kostenlos und ohne Konto testen. Für regelmäßige Nutzung
          danach eine Stufe wählen – das Kontingent wird nach Registrierung manuell freigeschaltet.
        </p>
        <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
            <div className="font-display text-lg font-semibold text-slate-800">Starter</div>
            <div className="mt-1 text-3xl font-semibold text-brand-700">
              {TIER_PREIS_EUR.starter}€<span className="text-sm font-normal text-slate-400"> / Monat</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{TIER_QUOTA.starter} Arbeitsblätter im Monat</p>
          </div>
          <div className="rounded-2xl border border-brand-300 bg-brand-50 p-6 text-center shadow-card">
            <div className="font-display text-lg font-semibold text-slate-800">Pro</div>
            <div className="mt-1 text-3xl font-semibold text-brand-700">
              {TIER_PREIS_EUR.pro}€<span className="text-sm font-normal text-slate-400"> / Monat</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{TIER_QUOTA.pro} Arbeitsblätter im Monat</p>
          </div>
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <CheckCircle2 size={14} className="text-brand-500" />
          Bezahlung wird privat organisiert – kein Kartendaten-Formular in der App.
        </p>
      </section>
    </main>
  );
}
