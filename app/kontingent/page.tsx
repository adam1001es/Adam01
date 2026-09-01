import { redirect } from "next/navigation";
import { Gauge } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getKontingent } from "@/lib/quota";
import KontingentBanner from "@/components/KontingentBanner";

export const dynamic = "force-dynamic";

/** Eigene Seite statt Banner auf Dashboard/Erstellen-Seite - hält diese Seiten optisch
 * aufgeräumt, die aktuelle Zahl bleibt trotzdem jederzeit über das Menü sichtbar (siehe
 * SiteHeader), Klick darauf führt hierher. */
export default async function KontingentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const kontingent = await getKontingent(user);

  return (
    <main className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Gauge size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Kontingent</h1>
          <p className="text-sm text-slate-500">Dein Arbeitsblatt-Kontingent im Überblick.</p>
        </div>
      </div>
      <KontingentBanner kontingent={kontingent} />
    </main>
  );
}
