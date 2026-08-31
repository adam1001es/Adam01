import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import NewWorksheetForm from "./NewWorksheetForm";
import { getSessionUser } from "@/lib/auth";
import { getKontingent } from "@/lib/quota";
import { getTrialStatus } from "@/lib/trial";

export const dynamic = "force-dynamic";

export default async function NewWorksheetPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const kontingent = await getKontingent(user);
  // Die Browser-/IP-Sperre (siehe lib/trial.ts) gilt zusätzlich zum persönlichen Kontingent,
  // aber nur für Konten ohne bezahltes Abo - sie verhindert, dass sich jemand mehrere
  // Gratis-Konten anlegt, um ein Vielfaches von KOSTENLOS_LIMIT zu bekommen.
  const netzwerkBlockiert =
    !kontingent.unbegrenzt && !kontingent.tier && (await getTrialStatus()).verbleibend <= 0;

  return (
    <main>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
          Neues Arbeitsblatt
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Alles auswählen und einstellen – Claude generiert und prüft den Inhalt automatisch.
        </p>
      </div>
      {netzwerkBlockiert && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">Gratis-Kontingent für diesen Browser/dieses Netzwerk aufgebraucht</div>
            <p className="mt-0.5">
              Dein Konto selbst hat noch Kontingent übrig, aber von diesem Browser/Netzwerk aus
              wurde das kostenlose Kontingent diesen Monat bereits vollständig genutzt
              (unabhängig vom Konto). Für mehr: ein Abo bei der Person anfragen, die den Zugang
              verwaltet.
            </p>
          </div>
        </div>
      )}
      <NewWorksheetForm
        kannErstellen={kontingent.verbleibend > 0 && !netzwerkBlockiert}
        bildKontingentAufgebraucht={kontingent.bildVerbleibend <= 0}
        bildFeatureNurAbo={kontingent.bildLimit === 0}
      />
    </main>
  );
}
