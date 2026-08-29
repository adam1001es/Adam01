import NewWorksheetForm from "./NewWorksheetForm";
import { getSessionUser } from "@/lib/auth";
import { getKontingent } from "@/lib/quota";
import { TRIAL_LIMIT, getTrialStatus } from "@/lib/trial";
import KontingentBanner from "@/components/KontingentBanner";
import TrialBanner from "@/components/TrialBanner";

export const dynamic = "force-dynamic";

export default async function NewWorksheetPage() {
  const user = await getSessionUser();
  const kontingent = user ? await getKontingent(user) : null;
  const trialStatus = user ? null : await getTrialStatus();
  const kannErstellen = kontingent ? kontingent.verbleibend > 0 : (trialStatus?.verbleibend ?? 0) > 0;

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
      <div className="mb-6">
        {kontingent ? (
          <KontingentBanner kontingent={kontingent} />
        ) : (
          <TrialBanner remaining={trialStatus!.verbleibend} limit={TRIAL_LIMIT} />
        )}
      </div>
      <NewWorksheetForm kannErstellen={kannErstellen} />
    </main>
  );
}
