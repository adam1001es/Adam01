import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookMarked, Search, BookOpenText, Quote } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { alleGeprüftenZitate, ermittleZitatQuellenart, ermittleHadithSammlung, kuerzeZitatVorschau } from "@/lib/wissensbasis";
import { THEMENBEREICHE, THEMENBEREICH_KEYS, ThemenbereichKey } from "@/lib/curriculum";
import { inputClass } from "@/lib/formStyles";

export const dynamic = "force-dynamic";

const QUELLENARTEN = [
  { id: "koran", label: "Koran" },
  { id: "hadith", label: "Hadith" },
] as const;

export default async function ZitateBibliothekPage({
  searchParams,
}: {
  searchParams: { themenbereich?: string; quellenart?: string; suche?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const themenbereichFilter = THEMENBEREICH_KEYS.includes(
    searchParams.themenbereich as ThemenbereichKey,
  )
    ? (searchParams.themenbereich as ThemenbereichKey)
    : null;
  const quellenartFilter = QUELLENARTEN.some((q) => q.id === searchParams.quellenart)
    ? (searchParams.quellenart as "koran" | "hadith")
    : null;
  const sucheFilter = searchParams.suche?.trim().toLowerCase() || null;

  const alle = await alleGeprüftenZitate();
  const gefiltert = alle.filter((z) => {
    if (themenbereichFilter && z.themenbereich !== themenbereichFilter) return false;
    if (quellenartFilter && ermittleZitatQuellenart(z.inhalt) !== quellenartFilter) return false;
    if (sucheFilter) {
      const haystack = `${z.inhalt.bezeichnung} ${z.inhalt.text ?? ""} ${z.inhalt.kontext ?? ""}`.toLowerCase();
      if (!haystack.includes(sucheFilter)) return false;
    }
    return true;
  });

  const filterAktiv = !!(themenbereichFilter || quellenartFilter || sucheFilter);

  return (
    <main className="mx-auto max-w-3xl">
      <Link
        href="/werkzeuge"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Zurück zu Werkzeuge
      </Link>
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        <BookMarked size={24} strokeWidth={2} /> Koran- & Hadith-Bibliothek
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Alle bereits geprüften Zitate aus der Wissensbasis - durchsuchbar, unabhängig von der
        Arbeitsblatt-Erstellung.
      </p>

      <details open={filterAktiv} className="group mt-5">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-slate-500 shadow-card transition hover:border-amber-300 hover:text-amber-700 [&::-webkit-details-marker]:hidden">
          <Search size={15} />
          Suchen &amp; filtern
          {filterAktiv && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              aktiv
            </span>
          )}
        </summary>
        <form
          method="GET"
          className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-surface p-4 shadow-card"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">Suchen</span>
            <input
              type="text"
              name="suche"
              defaultValue={searchParams.suche ?? ""}
              placeholder="z.B. Barmherzigkeit"
              className={`${inputClass} w-52`}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">Grundkompetenz</span>
            <select name="themenbereich" defaultValue={themenbereichFilter ?? ""} className={`${inputClass} w-56`}>
              <option value="">Alle</option>
              {THEMENBEREICH_KEYS.map((key) => (
                <option key={key} value={key}>
                  {THEMENBEREICHE[key].label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">Quellenart</span>
            <select name="quellenart" defaultValue={quellenartFilter ?? ""} className={`${inputClass} w-40`}>
              <option value="">Alle</option>
              {QUELLENARTEN.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-werkzeuge-gradient px-4 py-2.5 text-sm font-medium text-white shadow-card transition hover:shadow-card-hover"
          >
            Filtern
          </button>
          {filterAktiv && (
            <Link href="/werkzeuge/zitate" className="text-sm font-medium text-slate-500 hover:text-amber-700">
              Filter zurücksetzen
            </Link>
          )}
        </form>
      </details>

      {gefiltert.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-amber-200 bg-surface p-12 text-center shadow-card">
          <BookMarked className="mx-auto mb-3 text-amber-300" size={32} strokeWidth={1.5} />
          <p className="text-slate-600">
            {filterAktiv ? "Keine Zitate zu diesen Filtern gefunden." : "Noch keine geprüften Zitate vorhanden."}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-slate-500">
            {gefiltert.length} {gefiltert.length === 1 ? "Zitat" : "Zitate"}
          </p>
          <ul className="mt-3 space-y-3">
            {gefiltert.map((z) => {
              const quellenart = ermittleZitatQuellenart(z.inhalt);
              const themenbereich = THEMENBEREICH_KEYS.includes(z.themenbereich as ThemenbereichKey)
                ? (z.themenbereich as ThemenbereichKey)
                : "gemischt";
              return (
                <li key={z.id} className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                        quellenart === "koran"
                          ? "bg-brand-50 text-brand-700 ring-brand-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {quellenart === "koran" ? <BookOpenText size={11} /> : <Quote size={11} />}
                      {quellenart === "koran" ? "Koran" : ermittleHadithSammlung(z.inhalt)}
                    </span>
                    <span className="text-[11px] text-slate-400">{THEMENBEREICHE[themenbereich].label}</span>
                  </div>
                  <div className="mt-2 font-display text-base font-semibold text-slate-800" dir="auto">
                    {z.inhalt.bezeichnung}
                  </div>
                  {z.inhalt.text && (
                    <p className="mt-1 text-sm text-slate-600" dir="auto">
                      {kuerzeZitatVorschau(z.inhalt.text, 240)}
                    </p>
                  )}
                  {z.inhalt.kontext && (
                    <p className="mt-1.5 text-xs text-slate-400">Kontext: {z.inhalt.kontext}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
