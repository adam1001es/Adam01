import Link from "next/link";

/** Bewusst minimal und unauffällig (kleine graue Schrift, kein Rahmen/Hintergrund) - trotzdem von
 * jeder Seite mit einem Klick erreichbar (§5 ECG: "leicht und unmittelbar erreichbar"). */
export default function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-6xl justify-center gap-4 px-4 pb-6 pt-2 text-xs text-slate-400 sm:px-6">
      <Link href="/impressum" className="hover:text-slate-500 hover:underline">
        Impressum
      </Link>
      <Link href="/datenschutz" className="hover:text-slate-500 hover:underline">
        Datenschutz
      </Link>
    </footer>
  );
}
