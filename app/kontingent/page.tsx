import { redirect } from "next/navigation";

/** Kontingent ist jetzt Teil von "Profil" (siehe app/account) statt einer eigenen
 * Menüleisten-Seite - dieser Redirect fängt alte Lesezeichen/Links ab. */
export default function KontingentPage() {
  redirect("/account");
}
