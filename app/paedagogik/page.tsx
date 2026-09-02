export const metadata = {
  title: "Pädagogischer Ansatz - Lernwerk",
};

export default function PaedagogikPage() {
  return (
    <main className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-card">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-800">
          Pädagogischer Ansatz
        </h1>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Lehrplanverankerung</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Inhalte orientieren sich am aktuellen Lehrplan für den islamischen Religionsunterricht
            an österreichischen Schulen und dessen Grundkompetenzen - kein freies Erfinden von
            Themen, sondern eine Zuordnung zu tatsächlich vorgesehenen Kompetenzbereichen.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Zweifache Prüfung</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Jedes Arbeitsblatt wird in einem zweiten, unabhängigen Durchlauf gezielt
            gegengeprüft - auf Quellenangaben, Vollständigkeit, Altersgerechtigkeit und
            Kompetenzorientierung - bevor es angezeigt wird.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Wissensbasis statt freiem Erfinden</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Zitate (z.B. aus Koran und Hadith) und Fachbegriffe stammen aus einer kuratierten,
            von uns geprüften Wissensbasis statt aus dem freien Erinnern der KI - jede Quelle ist
            damit nachvollziehbar.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Altersgerechte Gestaltung</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Für die Volksschule stehen z.B. Mal- und Bewegungsaufgaben sowie Rücksicht auf noch
            ungeübte Leser:innen bereit; für Oberstufe und Matura höhere Anforderungsniveaus und
            eigene Prüfungsformate mit Punktevergabe. Details dazu unter{" "}
            <a href="/schulstufen" className="text-brand-600 hover:underline">
              Schulstufen
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
