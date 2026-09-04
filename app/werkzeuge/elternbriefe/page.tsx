import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Download } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { ELTERNBRIEF_VORLAGEN } from "@/lib/elternbriefe";

export const dynamic = "force-dynamic";

export default async function ElternbriefePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl">
      <Link
        href="/werkzeuge"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Zurück zu Werkzeuge
      </Link>
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        <Mail size={24} strokeWidth={2} /> Elternbrief-Vorlagen
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Fertige Word-Vorlagen mit [Platzhaltern] zum selbst Ausfüllen - direkt herunterladen und
        anpassen.
      </p>

      <ul className="mt-6 space-y-3">
        {ELTERNBRIEF_VORLAGEN.map((v) => (
          <li
            key={v.id}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-surface p-4 shadow-sm sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <div className="font-display text-base font-semibold text-slate-800">{v.titel}</div>
              <p className="mt-1 text-sm text-slate-500">{v.beschreibung}</p>
            </div>
            <a
              href={`/api/werkzeuge/elternbriefe/${v.id}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-werkzeuge-gradient px-4 py-2 text-sm font-medium text-white shadow-card-werkzeuge transition hover:shadow-card-werkzeuge-hover"
            >
              <Download size={15} /> Word
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
