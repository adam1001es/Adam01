import { holeSiteInhalte } from "@/lib/siteContent";

export const metadata = {
  title: "Datenschutzerklärung - Lernwerk",
};

/**
 * Bewusst knapp gehalten: nur die tatsächlich verarbeiteten Daten (Art. 13 DSGVO), keine
 * generischen Textbausteine für Verarbeitungen, die es hier nicht gibt (z.B. keine
 * Zahlungsanbieter, kein Tracking/Analytics-Dienst, kein Session-Replay - siehe Sentry-Konfig).
 * "Verantwortlicher" nutzt die Kontakt-E-Mail aus app/impressum (impressum.email in
 * lib/siteContent.ts) wieder statt eines eigenen Feldes - dieselbe reale Adresse, damit beide
 * Seiten nicht auseinanderlaufen; der mailto:-Link wird daraus zusammengesetzt statt fest im
 * Text zu stehen.
 */
export default async function DatenschutzPage() {
  const inhalte = await holeSiteInhalte();

  return (
    <main className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-card">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-800">
          Datenschutzerklärung
        </h1>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Verantwortlicher</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            {inhalte["datenschutz.verantwortlicherText"]} Kontakt:{" "}
            <a
              href={`mailto:${inhalte["impressum.email"]}`}
              className="text-brand-600 hover:underline"
            >
              {inhalte["impressum.email"]}
            </a>
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Konto &amp; Nutzung</h2>
          <p className="text-sm leading-relaxed text-slate-600">{inhalte["datenschutz.kontoNutzung"]}</p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Empfänger</h2>
          <p className="text-sm leading-relaxed text-slate-600">{inhalte["datenschutz.empfaenger"]}</p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Speicherdauer</h2>
          <p className="text-sm leading-relaxed text-slate-600">{inhalte["datenschutz.speicherdauer"]}</p>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Ihre Rechte</h2>
          <p className="text-sm leading-relaxed text-slate-600">{inhalte["datenschutz.rechte"]}</p>
        </section>
      </div>
    </main>
  );
}
