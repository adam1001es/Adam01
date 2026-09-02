import { redirect } from "next/navigation";
import { BookMarked } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { berechneAufgabentypAnalyse } from "@/lib/wissensbasis";
import WissensbasisClient, { WissensEintragRow } from "@/components/WissensbasisClient";

export const dynamic = "force-dynamic";

/** Admin-only "Wissensbasis" - eigener Top-Level-Bereich (siehe SiteHeader, nicht mehr nur eine
 * Unterseite der Konten-Verwaltung): Übersicht + Freigabe-Workflow für den wachsenden Pool aus
 * geprüften Zitaten/Musteraufgaben (siehe lib/wissensbasis.ts für das Gesamtkonzept). Die
 * eigentliche Interaktivität (Tabs, Freigeben/Ablehnen, Anlegen, Scan) sitzt in
 * WissensbasisClient - hier wird nur einmal serverseitig geladen. */
export default async function AdminWissensbasisPage() {
  const admin = await getSessionUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/");

  const eintraegeRaw = await prisma.wissensEintrag.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const eintraege: WissensEintragRow[] = eintraegeRaw.map((e) => {
    let inhalt: unknown = {};
    try {
      inhalt = JSON.parse(e.inhalt);
    } catch {
      inhalt = {};
    }
    return {
      id: e.id,
      typ: e.typ as "zitat" | "musteraufgabe" | "begriff",
      themenbereich: e.themenbereich,
      schulstufeCluster: e.schulstufeCluster,
      inhalt,
      rechercheNotiz: e.rechercheNotiz,
      quellWorksheetIds: e.quellWorksheetIds,
      status: e.status as "entwurf" | "geprueft" | "abgelehnt",
      createdAt: e.createdAt.toISOString(),
      geprueftAm: e.geprueftAm ? e.geprueftAm.toISOString() : null,
    };
  });

  const analyse = await berechneAufgabentypAnalyse();

  return (
    <main>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-700">
          <BookMarked size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Wissensbasis</h1>
          <p className="text-sm text-slate-500">
            Geprüfte Zitate, Musteraufgaben und Begriffe, auf die die Generierung künftig
            zugreift - mit der Zeit wachsender, sicherer Bestand statt Modellgedächtnis bei jeder
            Anfrage.
          </p>
        </div>
      </div>

      <WissensbasisClient eintraege={eintraege} analyse={analyse} />
    </main>
  );
}
