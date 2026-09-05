import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JahresplanVarianteUploadForm from "@/components/JahresplanVarianteUploadForm";
import EinfacherLoeschButton from "@/components/EinfacherLoeschButton";

export const dynamic = "force-dynamic";

/** Admin-exklusiver Upload künftiger Jahresplanungs-Kalendervarianten (siehe
 * lib/jahresplanImport.ts, lib/jahresplanVarianten.ts) - bewusst NICHT für Moderator:innen
 * freigegeben (anders als z.B. die Wissensbasis), da eine falsch übernommene Vorlage eine
 * offizielle Dienstpflicht-Dokumentation aller Lehrkräfte verfälschen würde. Die im Code
 * hinterlegten Varianten (lib/jahresplanKalender.ts, aktuell Schuljahr 2026/27) sind hier bewusst
 * NICHT lösch-/editierbar - nur admin-hochgeladene Varianten erscheinen in dieser Liste. */
export default async function AdminJahresplanVariantenPage() {
  const admin = await getSessionUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/");

  const varianten = await prisma.jahresplanVariante.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, varianteId: true, label: true, schuljahr: true, createdAt: true },
  });

  return (
    <main>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft size={15} /> Zurück zur Konten-Verwaltung
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <CalendarClock size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">
            Jahresplanung - Kalendervarianten
          </h1>
          <p className="text-sm text-slate-500">
            Neue Schuljahre aus der Word-Vorlage des Schulamts der IGGÖ hochladen - erst nach
            Prüfung/Bestätigung stehen sie allen Lehrkräften zur Auswahl.
          </p>
        </div>
      </div>

      <h2 className="mb-2 font-display text-lg font-semibold text-slate-800">Neue Variante hochladen</h2>
      <JahresplanVarianteUploadForm />

      <h2 className="mb-2 mt-8 font-display text-lg font-semibold text-slate-800">
        Bereits admin-hochgeladene Varianten
      </h2>
      {varianten.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Noch keine hochgeladen - bisher nur die im Code hinterlegten Varianten für 2026/27.
        </p>
      ) : (
        <ul className="space-y-2">
          {varianten.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-surface p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-800">{v.label}</div>
                <p className="text-xs text-slate-500">
                  Schuljahr {v.schuljahr} · Kennung {v.varianteId} · hochgeladen am{" "}
                  {v.createdAt.toLocaleDateString("de-AT")}
                </p>
              </div>
              <EinfacherLoeschButton
                url={`/api/admin/jahresplan-varianten/${v.id}`}
                bestaetigung={`Variante "${v.label}" wirklich löschen? Bereits angelegte Jahresplanungen mit dieser Vorlage zeigen danach keine Kalenderdaten mehr an.`}
                variant="button"
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
