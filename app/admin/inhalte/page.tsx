import { redirect } from "next/navigation";
import { PenSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { SITE_CONTENT_FELDER } from "@/lib/siteContent";
import EinklappbareSectionCard from "@/components/EinklappbareSectionCard";
import SiteContentFeldForm from "@/components/SiteContentFeldForm";

export const dynamic = "force-dynamic";

/** Admin-exklusives Bearbeitungspanel für Text-/Bild-Stellen auf öffentlichen/eingeloggten Seiten
 * (siehe lib/siteContent.ts SITE_CONTENT_FELDER) - KEIN hatModRechte(), das steht bewusst nur
 * vollen Admins zur Verfügung (siehe API-Route). Eine EinklappbareSectionCard je "Seite"-Gruppe,
 * darin ein SiteContentFeldForm je registriertem Feld. */
export default async function InhaltePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const eintraege = await prisma.siteContent.findMany();
  const overrideKeys = new Set(eintraege.filter((e) => e.value !== null).map((e) => e.key));
  const werte = new Map(eintraege.filter((e) => e.value !== null).map((e) => [e.key, e.value as string]));

  const gruppen = new Map<string, typeof SITE_CONTENT_FELDER>();
  for (const feld of SITE_CONTENT_FELDER) {
    const liste = gruppen.get(feld.seite) ?? [];
    liste.push(feld);
    gruppen.set(feld.seite, liste);
  }

  return (
    <main>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <PenSquare size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Inhalte bearbeiten</h1>
          <p className="text-sm text-slate-500">
            Texte und Bilder auf öffentlichen/eingeloggten Seiten direkt aktualisieren - jede
            Änderung ist sofort live sichtbar.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {Array.from(gruppen.entries()).map(([seite, felder]) => (
          <EinklappbareSectionCard key={seite} icon={<PenSquare size={18} strokeWidth={2} />} title={seite}>
            <div className="space-y-3">
              {felder.map((feld) => (
                <SiteContentFeldForm
                  key={feld.key}
                  feld={feld}
                  initialValue={werte.get(feld.key) ?? feld.standard}
                  initialIstOverride={overrideKeys.has(feld.key)}
                />
              ))}
            </div>
          </EinklappbareSectionCard>
        ))}
      </div>
    </main>
  );
}
