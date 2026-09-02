export const metadata = {
  title: "Über Lernwerk",
};

export default function UeberUnsPage() {
  return (
    <main className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-card">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-800">Über Lernwerk</h1>

        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          Lernwerk ist für Lehrkräfte des islamischen Religionsunterrichts an österreichischen
          Schulen entstanden: Statt jedes Arbeitsblatt von Grund auf selbst zu recherchieren und zu
          gestalten, entsteht es hier lehrplanorientiert, mit belegten Quellen und einer
          eigenständigen Qualitätsprüfung - in wenigen Minuten statt Stunden.
        </p>

        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          Der Fokus liegt bewusst auf Qualität statt Menge: jedes Arbeitsblatt wird gegen
          Quellenangaben, Vollständigkeit, Altersgerechtigkeit und Kompetenzorientierung
          geprüft, bevor es angezeigt wird (mehr dazu unter{" "}
          <a href="/paedagogik" className="text-brand-600 hover:underline">
            Pädagogischer Ansatz
          </a>
          ).
        </p>

        <p className="text-sm leading-relaxed text-slate-600">
          Neben dem Erstellen einzelner Arbeitsblätter unterstützt Lernwerk auch die
          Klassenverwaltung (anonymisiert, ohne echte Schülernamen), das Zusammenstellen und
          Generieren von Prüfungen sowie eine Community, in der Lehrkräfte Arbeitsblätter
          untereinander teilen können.
        </p>
      </div>
    </main>
  );
}
