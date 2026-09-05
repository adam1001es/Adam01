import {
  TIER_PUNKTE_QUOTA,
  TIER_PREIS_EUR,
  KOSTENLOS_PUNKTE_LIMIT,
  formatEur,
  formatArbeitsblaetterSpanne,
} from "@/lib/quota";
import { holeSiteInhalte } from "@/lib/siteContent";

export const metadata = {
  title: "Häufige Fragen - Lernwerk",
};

export default async function FaqPage() {
  const inhalte = await holeSiteInhalte();

  // Frage 1 (Preise) bewusst NICHT admin-editierbar (siehe lib/siteContent.ts) - der Text enthält
  // echte, sich ändernde Preis-/Punktezahlen aus lib/quota.ts, ein Override würde diese sonst
  // stillschweigend einfrieren. Fragen 2-5 kommen aus der Registry (siehe app/admin/inhalte).
  const FRAGEN: { frage: string; antwort: React.ReactNode }[] = [
    {
      frage: "Was kostet Lernwerk?",
      antwort:
        `${KOSTENLOS_PUNKTE_LIMIT} Punkte (${formatArbeitsblaetterSpanne(KOSTENLOS_PUNKTE_LIMIT)}) können einmalig kostenlos getestet werden. Danach kostet das Abo ${formatEur(TIER_PREIS_EUR.pro)} € im Monat für ${TIER_PUNKTE_QUOTA.pro} Punkte (${formatArbeitsblaetterSpanne(TIER_PUNKTE_QUOTA.pro)}). 1 Punkt entspricht den tatsächlich gemessenen KI-Kosten - je nach Umfang eines Arbeitsblatts werden also unterschiedlich viele Punkte verbraucht, statt einer festen Stückzahl.`,
    },
    { frage: inhalte["faq.frage.erstellung"], antwort: inhalte["faq.antwort.erstellung"] },
    { frage: inhalte["faq.frage.datenschutz"], antwort: inhalte["faq.antwort.datenschutz"] },
    { frage: inhalte["faq.frage.community"], antwort: inhalte["faq.antwort.community"] },
    { frage: inhalte["faq.frage.pruefungen"], antwort: inhalte["faq.antwort.pruefungen"] },
  ];

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
