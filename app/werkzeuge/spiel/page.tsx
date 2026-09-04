import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import WissensBloecke from "@/components/WissensBloecke";

export const dynamic = "force-dynamic";

export default async function SpielPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-lg">
      <Link
        href="/werkzeuge"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Zurück zu Werkzeuge
      </Link>
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        <Gamepad2 size={24} strokeWidth={2} /> Wissensblöcke
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Kurze Auflockerung zwischendurch - ein rundenbasiertes Kästchen-Puzzle mit Fragen zu
        Schulrecht, Pädagogik, islamischem Grundwissen und Schulalltag. Kein Zeitdruck: erst die
        Frage in Ruhe beantworten, dann in Ruhe platzieren.
      </p>

      <div className="mt-5">
        <WissensBloecke />
      </div>
    </main>
  );
}
