import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { geprüfteBegriffe } from "@/lib/wissensbasis";
import VokabelTrainer from "@/components/VokabelTrainer";

export const dynamic = "force-dynamic";

export default async function VokabelnPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const begriffe = await geprüfteBegriffe();

  return (
    <main className="mx-auto max-w-xl">
      <Link
        href="/werkzeuge"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Zurück zu Werkzeuge
      </Link>
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        <Layers size={24} strokeWidth={2} /> Arabisch-Vokabeltrainer
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Islamische Fachbegriffe aus der geprüften Wissensbasis - als Karteikarten üben.
      </p>

      <div className="mt-6">
        <VokabelTrainer
          initialVokabeln={begriffe.map((b) => ({
            id: b.id,
            begriff: b.inhalt.begriff,
            arabisch: b.inhalt.arabisch,
            bedeutung: b.inhalt.bedeutung,
            kontext: b.inhalt.kontext,
          }))}
        />
      </div>
    </main>
  );
}
