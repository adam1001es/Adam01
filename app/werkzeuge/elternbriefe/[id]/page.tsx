import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { findeElternbriefVorlage } from "@/lib/elternbriefe";
import ElternbriefEditor from "@/components/ElternbriefEditor";

export const dynamic = "force-dynamic";

export default async function ElternbriefBearbeitenPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const vorlage = findeElternbriefVorlage(params.id);
  if (!vorlage) notFound();

  return (
    <main className="mx-auto max-w-4xl">
      <Link
        href="/werkzeuge/elternbriefe"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-700"
      >
        <ArrowLeft size={15} /> Andere Vorlage wählen
      </Link>
      <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
        <Mail size={24} strokeWidth={2} /> {vorlage.titel}
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">{vorlage.beschreibung}</p>

      <div className="mt-6">
        <ElternbriefEditor vorlage={vorlage} />
      </div>
    </main>
  );
}
