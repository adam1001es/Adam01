"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FilePlus2,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  UserCircle,
  Users,
  Gauge,
  MoonStar,
  GraduationCap,
} from "lucide-react";

function LogoMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-card">
      <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="#f4ead1" />
      </svg>
    </span>
  );
}

const NAV = [
  { href: "/", label: "Übersicht", icon: LayoutDashboard },
  { href: "/new", label: "Neues Arbeitsblatt", icon: FilePlus2 },
];

interface SiteHeaderUser {
  email: string;
  username: string | null;
  role: string;
  istZahlend: boolean;
  kontingent: { verbraucht: number; limit: number; verbleibend: number; unbegrenzt: boolean } | null;
}

export default function SiteHeader({
  user,
  hijriDatum,
}: {
  user: SiteHeaderUser | null;
  /** Heutiges Hijri-Datum (z.B. "17. Rabi al-Awwal 1448 n. H.") - immer sichtbar, unabhängig
   * vom Login-Status, als kleiner einladender islamischer Akzent im Kopfbereich (siehe
   * lib/hijri.ts). Eigene volle Zeile statt Platz in der ohnehin engen Navigation zu
   * beanspruchen. */
  hijriDatum: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navLinkClass = (active: boolean, warnung = false) =>
    `flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium transition active:scale-95 sm:px-3.5 ${
      active
        ? "bg-brand-gradient text-white shadow-card"
        : warnung
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
    }`;

  // Der Klassen-Bereich hat bewusst eine eigene Farbidentität (violett/pink statt Marken-Grün,
  // siehe tailwind.config klassen-gradient) - er fühlt sich dadurch schon in der Navigation wie
  // ein eigener "Modus" innerhalb von Lernwerk an, nicht nur eine weitere Arbeitsblatt-Funktion.
  const navLinkClassKlassen = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium transition active:scale-95 sm:px-3.5 ${
      active
        ? "bg-klassen-gradient text-white shadow-card-klassen"
        : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
    }`;

  return (
    <header className="no-print sticky top-0 z-10 border-b border-slate-200/80 bg-canvas/85 backdrop-blur-md">
      <div className="border-b border-gold-100 bg-gold-50/70 px-4 py-1 text-center text-[11px] font-medium text-gold-700 sm:px-6">
        <span className="inline-flex items-center gap-1.5">
          <MoonStar size={11} strokeWidth={2.25} />
          {hijriDatum}
        </span>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-y-1.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition active:scale-95 sm:gap-3">
          <LogoMark />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold text-brand-800 sm:text-lg">
              Lernwerk
            </span>
            <span className="hidden text-xs text-slate-500 sm:inline">
              Islamischer Religionsunterricht · Österreich
            </span>
          </span>
        </Link>
        {/* Auf Mobile eine klar abgetrennte eigene Zeile (Trennlinie + Abstand) statt einfach
            per flex-wrap unter das Logo zu rutschen, ohne dass die beiden Bereiche optisch
            ineinander verschwimmen - auf sm: und größer wieder ganz normal in derselben Zeile
            wie das Logo. */}
        <nav className="mt-2 flex flex-wrap items-center gap-0.5 border-t border-slate-200/80 pt-2 sm:mt-0 sm:gap-2 sm:border-t-0 sm:pt-0">
          {user &&
            NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
              return (
                <Link key={href} href={href} className={navLinkClass(!!active)}>
                  <Icon size={16} strokeWidth={2.25} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          {user?.kontingent && (
            <Link
              href="/kontingent"
              title="Kontingent"
              className={navLinkClass(
                !!pathname?.startsWith("/kontingent"),
                !user.kontingent.unbegrenzt && user.kontingent.verbleibend === 0,
              )}
            >
              <Gauge size={16} strokeWidth={2.25} />
              <span>
                {user.kontingent.unbegrenzt
                  ? "∞"
                  : `${user.kontingent.verbraucht}/${user.kontingent.limit}`}
              </span>
            </Link>
          )}
          {user?.istZahlend && (
            <Link href="/community" className={navLinkClass(!!pathname?.startsWith("/community"))}>
              <Users size={16} strokeWidth={2.25} />
              <span className="hidden sm:inline">Geteilte Arbeitsblätter</span>
            </Link>
          )}
          {user?.istZahlend && (
            <Link href="/klassen" className={navLinkClassKlassen(!!pathname?.startsWith("/klassen"))}>
              <GraduationCap size={16} strokeWidth={2.25} />
              <span className="hidden sm:inline">Klassen</span>
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin" className={navLinkClass(!!pathname?.startsWith("/admin"))}>
              <ShieldCheck size={16} strokeWidth={2.25} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/account"
                title="Mein Konto"
                aria-label="Mein Konto"
                className={navLinkClass(!!pathname?.startsWith("/account"))}
              >
                <UserCircle size={16} strokeWidth={2.25} />
                <span className="hidden md:inline">{user.username ?? user.email}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Abmelden"
                aria-label="Abmelden"
                className="flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium text-slate-500 transition active:scale-95 sm:px-3.5 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={16} strokeWidth={2.25} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-brand-gradient px-3.5 py-2 text-sm font-medium text-white shadow-card transition active:scale-95"
            >
              Anmelden
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
