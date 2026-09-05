import { holeSiteInhalte } from "@/lib/siteContent";

export const metadata = {
  title: "Pädagogischer Ansatz - Lernwerk Hilal",
};

export default async function PaedagogikPage() {
  const inhalte = await holeSiteInhalte();

  return (
    <main className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-card">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-800">
          Pädagogischer Ansatz
        </h1>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">{inhalte["paedagogik.lehrplan.titel"]}</h2>
          <p className="text-sm leading-relaxed text-slate-600">{inhalte["paedagogik.lehrplan.text"]}</p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">{inhalte["paedagogik.pruefung.titel"]}</h2>
          <p className="text-sm leading-relaxed text-slate-600">{inhalte["paedagogik.pruefung.text"]}</p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">{inhalte["paedagogik.wissensbasis.titel"]}</h2>
          <p className="text-sm leading-relaxed text-slate-600">{inhalte["paedagogik.wissensbasis.text"]}</p>
        </section>

        {/* Bewusst NICHT admin-editierbar (siehe lib/siteContent.ts) - enthält einen internen Link
            auf /schulstufen, der bei einem reinen Text-Override verloren ginge. */}
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
