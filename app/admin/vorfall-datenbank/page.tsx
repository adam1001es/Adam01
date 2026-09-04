import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import VorfallDatenbankErklaerung from "@/components/VorfallDatenbankErklaerung";

export const dynamic = "force-dynamic";

/** Admin-only Rückblick auf den Datenbank-Vorfall vom 3./4. September 2026 (siehe SiteHeader,
 * eigener Nav-Eintrag nur für role "admin"). Rein statische Erklärseite ohne DB-Zugriff - dient
 * nur als persönliche Lernressource für den Betreiber, nicht als produktive Funktion. */
export default async function VorfallDatenbankPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  return (
    <main>
      <VorfallDatenbankErklaerung />
    </main>
  );
}
