export const metadata = {
  title: "Schulstufen - Lernwerk",
};

export default function SchulstufenPage() {
  return (
    <main className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-card">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-800">Schulstufen</h1>

        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          Lernwerk deckt alle Schulstufen des islamischen Religionsunterrichts an österreichischen
          Schulen ab - von der 1. Klasse Volksschule bis zur Matura. Inhalte, Aufgabentypen und
          Anforderungsniveau passen sich dabei automatisch der gewählten Schulstufe an.
        </p>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Volksschule (1.-4. Klasse)</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Spielerischer Zugang mit Mal- und Bewegungsaufgaben, kurzen Texten und Rücksicht auf
            noch ungeübte Leser:innen (z.B. Hinweise zum Vorlesen statt reiner Lesetexte).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">
            Sekundarstufe 1 (Mittelschule/AHS-Unterstufe, 5.-8. Schulstufe)
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Breitere Mischung an Aufgabentypen (u.a. Multiple Choice, Lückentext, Zuordnung,
            offene Fragen) zur Vertiefung des Grundwissens.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">
            Sekundarstufe 2 (Polytechnische Schule, AHS-Oberstufe/BMHS, Berufsschule)
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Anspruchsvollere Aufgabenstellungen mit stärkerer Gewichtung höherer
            Anforderungsbereiche - hier lassen sich auch echte Prüfungen inklusive Punktevergabe
            zusammenstellen oder generieren, gezielt auch für Maturaklassen.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Berufsschule</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Eigene, an den Berufsschul-Kontext angepasste Themenvorschläge.
          </p>
        </section>
      </div>
    </main>
  );
}
