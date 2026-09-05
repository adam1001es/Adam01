import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, NotebookPen } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import JahresplanErstellenForm from "@/components/JahresplanErstellenForm";

export const dynamic = "force-dynamic";

export default async function NeueJahresplanungPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-xl">
      <Link
        href="/werkzeuge/jahresplanung"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Zurück zur Übersicht
      </Link>
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        <NotebookPen size={24} strokeWidth={2} /> Neue Jahresplanung
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Die Wochentabelle selbst füllst du im nächsten Schritt aus.
      </p>

      <div className="mt-6">
        <JahresplanErstellenForm />
      </div>
    </main>
  );
}
