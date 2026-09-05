import { holeSiteInhalte } from "@/lib/siteContent";

export const metadata = {
  title: "Schulstufen - Lernwerk",
};

export default async function SchulstufenPage() {
  const inhalte = await holeSiteInhalte();

  return (
    <main className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-card">
        <h1 className="mb-6 font-display text-2xl font-semibold text-slate-800">Schulstufen</h1>

        <p className="mb-6 text-sm leading-relaxed text-slate-600">{inhalte["schulstufen.intro"]}</p>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">{inhalte["schulstufen.volksschule.titel"]}</h2>
          <p className="text-sm leading-relaxed text-slate-600">{inhalte["schulstufen.volksschule.text"]}</p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">{inhalte["schulstufen.sek1.titel"]}</h2>
          <p className="text-sm leading-relaxed text-slate-600">{inhalte["schulstufen.sek1.text"]}</p>
        </section>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">{inhalte["schulstufen.sek2.titel"]}</h2>
          <p className="text-sm leading-relaxed text-slate-600">{inhalte["schulstufen.sek2.text"]}</p>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-semibold text-slate-700">{inhalte["schulstufen.berufsschule.titel"]}</h2>
          <p className="text-sm leading-relaxed text-slate-600">{inhalte["schulstufen.berufsschule.text"]}</p>
        </section>
      </div>
    </main>
  );
}
