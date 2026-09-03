import {
  TIER_PUNKTE_QUOTA,
  TIER_PREIS_EUR,
  KOSTENLOS_PUNKTE_LIMIT,
  formatEur,
  formatArbeitsblaetterSpanne,
} from "@/lib/quota";

export const metadata = {
  title: "Häufige Fragen - Lernwerk",
};

const FRAGEN: { frage: string; antwort: React.ReactNode }[] = [
  {
    frage: "Was kostet Lernwerk?",
    antwort:
      `${KOSTENLOS_PUNKTE_LIMIT} Punkte (${formatArbeitsblaetterSpanne(KOSTENLOS_PUNKTE_LIMIT)}) können einmalig kostenlos getestet werden. Danach kostet das Abo ${formatEur(TIER_PREIS_EUR.pro)} € im Monat für ${TIER_PUNKTE_QUOTA.pro} Punkte (${formatArbeitsblaetterSpanne(TIER_PUNKTE_QUOTA.pro)}). 1 Punkt entspricht den tatsächlich gemessenen KI-Kosten - je nach Umfang eines Arbeitsblatts werden also unterschiedlich viele Punkte verbraucht, statt einer festen Stückzahl.`,
  },
  {
    frage: "Wie werden die Arbeitsblätter erstellt?",
    antwort:
      "KI-gestützt und lehrplanorientiert, mit Zitaten/Begriffen aus einer kuratierten Wissensbasis. Ein zweiter, unabhängiger KI-Durchlauf prüft jedes Arbeitsblatt gezielt gegen, bevor es angezeigt wird.",
  },
  {
    frage: "Sind Schülerdaten sicher?",
    antwort:
      "Schüler:innen werden in der Klassen-Funktion nur mit einem selbst gewählten Kürzel geführt (z.B. „Schüler 1“), nie mit echten Namen.",
  },
  {
    frage: "Was ist die Community?",
    antwort:
      "Ein Bereich, in dem Lehrkräfte ihre Arbeitsblätter freiwillig teilen und die Arbeitsblätter anderer durchsuchen und verwenden können.",
  },
  {
    frage: "Kann ich damit auch Prüfungen erstellen?",
    antwort:
      "Ja, auf zwei Wegen: aus bereits vorhandenen Arbeitsblättern zusammenstellen (kostet kein zusätzliches Kontingent) oder komplett neu generieren (zählt wie ein normales Arbeitsblatt zum Kontingent).",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-card">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-800">
          Häufige Fragen
        </h1>

        <div className="space-y-6">
          {FRAGEN.map(({ frage, antwort }) => (
            <section key={frage}>
              <h2 className="mb-1 text-sm font-semibold text-slate-700">{frage}</h2>
              <p className="text-sm leading-relaxed text-slate-600">{antwort}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
