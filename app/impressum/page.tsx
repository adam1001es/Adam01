export const metadata = {
  title: "Impressum - Lernwerk",
};

/**
 * Bewusst nur die eindeutig verpflichtenden Angaben (§5 ECG: Name/Anschrift des
 * Diensteanbieters + Kontaktmöglichkeit; EU-Verordnung 524/2013: Link zur OS-Plattform bei
 * Online-Dienstleistungsverträgen mit Verbraucher:innen). Absichtlich nicht in der
 * Seitennavigation verlinkt, sondern nur über den kleinen Footer-Link erreichbar (siehe
 * components/SiteFooter.tsx) - bleibt trotzdem mit einem Klick von jeder Seite aus erreichbar
 * (§5 ECG: "leicht und unmittelbar erreichbar").
 */
export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-card">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-800">Impressum</h1>

        <section className="mb-6">
          <p className="text-sm leading-relaxed text-slate-600">
            Dua Zentrum
            <br />
            Beethovenplatz 1 (Ecke Lothringerstraße)
            <br />
            1010 Wien
            <br />
            Österreich
            <br />
            Vertreten durch: Adam Es
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Kontakt</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            E-Mail:{" "}
            <a href="mailto:magdykasim30008000@gmail.com" className="text-brand-600 hover:underline">
              magdykasim30008000@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-semibold text-slate-700">
            EU-Streitschlichtung
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
            bereit, abrufbar unter{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
