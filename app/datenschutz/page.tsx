export const metadata = {
  title: "Datenschutzerklärung - Lernwerk",
};

/**
 * Bewusst knapp gehalten: nur die tatsächlich verarbeiteten Daten (Art. 13 DSGVO), keine
 * generischen Textbausteine für Verarbeitungen, die es hier nicht gibt (z.B. keine
 * Zahlungsanbieter, kein Tracking/Analytics-Dienst, kein Session-Replay - siehe Sentry-Konfig).
 */
export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-card">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-800">
          Datenschutzerklärung
        </h1>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Verantwortlicher</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Dua Zentrum, Beethovenplatz 1 (Ecke Lothringerstraße), 1010 Wien, vertreten durch Adam
            Es. Kontakt:{" "}
            <a href="mailto:magdykasim30008000@gmail.com" className="text-brand-600 hover:underline">
              magdykasim30008000@gmail.com
            </a>
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Konto &amp; Nutzung</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Bei der Registrierung verarbeiten wir E-Mail-Adresse und Passwort (verschlüsselt
            gespeichert), zur Anmeldung ein technisch notwendiges Session-Cookie. Grundlage ist die
            Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO). Schüler:innen werden in der
            Klassen-Funktion ausschließlich mit einem selbst gewählten Kürzel geführt, nie mit
            echten Namen.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Empfänger</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Zur Erbringung des Dienstes setzen wir folgende Auftragsverarbeiter ein: Anthropic
            (USA) zur Erstellung der Arbeitsblatt-Inhalte, Google/Gmail zum Versand von
            System-E-Mails (z.B. Bestätigungslink), Sentry zur technischen Fehlererfassung (ohne
            Bildschirmaufzeichnung).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Speicherdauer</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Kontodaten werden bis zur Löschung des Kontos gespeichert.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Ihre Rechte</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
            Verarbeitung, Datenübertragbarkeit sowie Widerspruch (Art. 15-21 DSGVO) - Anfragen an
            obige Kontakt-E-Mail. Außerdem besteht ein Beschwerderecht bei der österreichischen
            Datenschutzbehörde (dsb.gv.at).
          </p>
        </section>
      </div>
    </main>
  );
}
