import { holeSiteInhalte } from "@/lib/siteContent";

export const metadata = {
  title: "Über Lernwerk Hilal",
};

export default async function UeberUnsPage() {
  const inhalte = await holeSiteInhalte();

  return (
    <main className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-card">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-800">Über Lernwerk Hilal</h1>

        <p className="mb-4 text-sm leading-relaxed text-slate-600">{inhalte["ueberuns.absatz1"]}</p>

        {/* Bewusst NICHT admin-editierbar (siehe lib/siteContent.ts) - enthält einen internen Link
            auf /paedagogik, der bei einem reinen Text-Override verloren ginge. */}
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          Der Fokus liegt bewusst auf Qualität statt Menge: jedes Arbeitsblatt wird gegen
          Quellenangaben, Vollständigkeit, Altersgerechtigkeit und Kompetenzorientierung
          geprüft, bevor es angezeigt wird (mehr dazu unter{" "}
          <a href="/paedagogik" className="text-brand-600 hover:underline">
            Pädagogischer Ansatz
          </a>
          ).
        </p>

        <p className="text-sm leading-relaxed text-slate-600">{inhalte["ueberuns.absatz3"]}</p>
      </div>
    </main>
  );
}
