import { redirect } from "next/navigation";
import NewWorksheetForm from "./NewWorksheetForm";
import { getSessionUser } from "@/lib/auth";
import { getKontingent } from "@/lib/quota";
import KontingentBanner from "@/components/KontingentBanner";

export const dynamic = "force-dynamic";

export default async function NewWorksheetPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const kontingent = await getKontingent(user);

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
        <KontingentBanner kontingent={kontingent} />
      </div>
      <NewWorksheetForm kannErstellen={kontingent.verbleibend > 0} />
    </main>
  );
}
