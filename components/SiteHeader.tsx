"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FilePlus2,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Users,
  MoonStar,
  GraduationCap,
  BookMarked,
  Lock,
  MessagesSquare,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import SonnenuntergangAnzeige from "./SonnenuntergangAnzeige";
import { avatarAnzeige } from "@/lib/profil";
import type { NutzerStatus } from "@/lib/status";
import AvatarKreis from "./AvatarKreis";

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
  avatarFarbe: string;
  avatarTextFarbe: string;
  avatarKuerzel: string | null;
  status: string;
}

export default function SiteHeader({
  user,
  hijriDatum,
  offeneWissensEntwuerfe,
  neueRegistrierungen,
}: {
  user: SiteHeaderUser | null;
  /** Heutiges Hijri-Datum (z.B. "17. Rabi al-Awwal 1448 n. H.") - immer sichtbar, unabhängig
   * vom Login-Status, als kleiner einladender islamischer Akzent im Kopfbereich (siehe
   * lib/hijri.ts). Eigene volle Zeile statt Platz in der ohnehin engen Navigation zu
   * beanspruchen. */
  hijriDatum: string;
  /** Nur für role "admin" gesetzt (siehe app/layout.tsx) - Anzahl ungeprüfter Wissensbasis-
   * Entwürfe als Badge am Nav-Eintrag, analog zu den ungesichteten Meldungen. */
  offeneWissensEntwuerfe?: number;
  /** Nur für role "admin" gesetzt (siehe app/layout.tsx) - Anzahl Registrierungen seit dem
   * letzten Besuch von app/admin (siehe User.letzteKontenAnsicht). Als reiner Punkt statt Zahl
   * dargestellt (siehe unten), damit er auch auf Mobile sichtbar bleibt, wo die Textbeschriftung
   * der Nav-Icons ausgeblendet ist. */
  neueRegistrierungen?: number;
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

  // Der Klassen-Bereich nutzt die hellste Stufe des Teal-Bandes (siehe tailwind.config
  // klassen-gradient) - eine Nuance heller als die Marke selbst, damit er sich in der Navigation
  // wie ein eigener "Modus" innerhalb von Lernwerk anfühlt, ohne die Farbfamilie zu verlassen.
  const navLinkClassKlassen = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium transition active:scale-95 sm:px-3.5 ${
      active
        ? "bg-klassen-gradient text-white shadow-card-klassen"
        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
    }`;

  // Geteilte Arbeitsblätter (Community) bekommt nur einen LEICHTEN Ton-Unterschied zur Übersicht
  // (siehe tailwind.config community-gradient) - keine eigene Farbidentität wie Klassen. Der
  // Hover-Akzent ist bewusst Cyan statt Teal, da "brand" (Übersicht/Standard-Hover) jetzt selbst
  // Teal ist - sonst wären beide Hover-Zustände ununterscheidbar.
  const navLinkClassCommunity = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium transition active:scale-95 sm:px-3.5 ${
      active
        ? "bg-community-gradient text-white shadow-card"
        : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"
    }`;

  // Wissensbasis bekommt bewusst Gold statt einer weiteren Teal-Stufe (siehe tailwind.config
  // wissen-gradient) - eigener, eindeutig unterscheidbarer Bereich statt einer Unterseite der
  // Konten-Verwaltung: hier wächst der geprüfte Bestand an Zitaten/Musteraufgaben, aus dem
  // künftige Generierungen schöpfen.
  const navLinkClassWissen = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium transition active:scale-95 sm:px-3.5 ${
      active
        ? "bg-wissen-gradient text-white shadow-card-wissen"
        : "text-slate-600 hover:bg-gold-50 hover:text-gold-700"
    }`;

  // Forum bekommt Indigo statt einer weiteren Teal-Stufe (Community/Klassen) oder Gold
  // (Wissensbasis) - eigener, eindeutig unterscheidbarer Bereich (siehe tailwind.config
  // forum-gradient).
  const navLinkClassForum = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium transition active:scale-95 sm:px-3.5 ${
      active
        ? "bg-forum-gradient text-white shadow-card-forum"
        : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
    }`;

  // Werkzeuge bekommt Amber/Orange statt einer weiteren Teal-Stufe oder einer der bestehenden
  // Bereichsfarben - eigener, eindeutig unterscheidbarer Bereich für Alltagswerkzeuge ohne
  // KI-Kontingent (siehe tailwind.config.ts werkzeuge-gradient).
  const navLinkClassWerkzeuge = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium transition active:scale-95 sm:px-3.5 ${
      active
        ? "bg-werkzeuge-gradient text-white shadow-card-werkzeuge"
        : "text-slate-600 hover:bg-amber-50 hover:text-amber-700"
    }`;

  return (
    // NICHT MEHR "sticky": auf mind. einem Gerät (iPhone/Firefox) blieb selbst ein komplett
    // undurchsichtiger, blur-freier Hintergrund beim Scrollen sichtbar von darunterliegendem
    // Seiteninhalt durchsetzt - kein Deckkraft-/Blur-Problem mehr, sondern ein tieferliegender
    // Render-/Compositing-Fehler des Browsers beim Zeichnen des "sticky" Elements selbst. Einzige
    // Lösung, die das garantiert ausschließt: der Header scrollt jetzt ganz normal mit der Seite
    // mit (kein top-0/sticky mehr) statt oben "kleben" zu bleiben - Nachteil: Datum/Logo/
    // Navigation sind beim Scrollen nicht mehr durchgehend sichtbar, dafür kann er technisch gar
    // nicht mehr über/unter dem restlichen Inhalt zu liegen kommen.
    <header className="no-print border-b border-slate-200/80 bg-canvas">
      <div className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 border-b border-slate-200/70 bg-white px-4 py-1 pr-9 text-center text-[11px] font-medium text-slate-500 sm:px-6 sm:pr-12">
        <span className="inline-flex items-center gap-1.5">
          <MoonStar size={11} strokeWidth={2.25} />
          {hijriDatum}
        </span>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <SonnenuntergangAnzeige />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-5">
          <ThemeToggle />
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
          {/* Community/Forum bewusst für ALLE eingeloggten Konten sichtbar (nicht mehr hinter
              istZahlend versteckt) - kostenlose Konten sehen dort inzwischen den echten Inhalt
              zum Mitlesen, können aber nicht alles ausführen (kleines Schloss-Icon als Hinweis
              darauf, siehe app/community/page.tsx, app/forum/page.tsx). Klassen dagegen ist für
              kostenlose Konten VOLL nutzbar (nur fremde geteilte Arbeitsblätter lassen sich nicht
              zuweisen) - deshalb bewusst OHNE Schloss-Icon, siehe app/klassen/page.tsx. */}
          {user && (
            <Link href="/community" className={navLinkClassCommunity(!!pathname?.startsWith("/community"))}>
              <Users size={16} strokeWidth={2.25} />
              <span className="hidden sm:inline">Geteilte Arbeitsblätter</span>
              {!user.istZahlend && <Lock size={11} strokeWidth={2.5} className="opacity-60" />}
            </Link>
          )}
          {user && (
            <Link href="/klassen" className={navLinkClassKlassen(!!pathname?.startsWith("/klassen"))}>
              <GraduationCap size={16} strokeWidth={2.25} />
              <span className="hidden sm:inline">Klassen</span>
            </Link>
          )}
          {user && (
            <Link href="/forum" className={navLinkClassForum(!!pathname?.startsWith("/forum"))}>
              <MessagesSquare size={16} strokeWidth={2.25} />
              <span className="hidden sm:inline">Forum</span>
              {!user.istZahlend && <Lock size={11} strokeWidth={2.5} className="opacity-60" />}
            </Link>
          )}
          {/* Werkzeuge sind bewusst für ALLE eingeloggten Konten voll nutzbar (kein
              Schloss-Symbol) - anders als Community/Forum verbraucht hier nichts KI-Kontingent
              (Kalender ist reine Datumsrechnung, Zitate-/Vokabel-Bibliothek liest nur bereits
              admin-geprüfte Wissensbasis-Einträge). */}
          {user && (
            <Link href="/werkzeuge" className={navLinkClassWerkzeuge(!!pathname?.startsWith("/werkzeuge"))}>
              <Wrench size={16} strokeWidth={2.25} />
              <span className="hidden sm:inline">Werkzeuge</span>
            </Link>
          )}
          {user ? (
            <Link
              href="/account"
              title="Profil"
              aria-label="Profil"
              className={navLinkClass(!!pathname?.startsWith("/account"))}
            >
              <AvatarKreis
                anzeige={avatarAnzeige(user.avatarKuerzel, user.username)}
                farbe={user.avatarFarbe}
                textFarbe={user.avatarTextFarbe}
                status={user.status as NutzerStatus}
                size={26}
              />
              <span className="hidden md:inline" dir="auto">
                {user.username ?? user.email}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-brand-gradient px-3.5 py-2 text-sm font-medium text-white shadow-card transition active:scale-95"
            >
              Anmelden
            </Link>
          )}
          {/* Admin-Bereich klar vom normalen Nutzer-Menü abgesetzt (eigener Wunsch des Betreibers,
              der als einziges Admin-Konto sonst nicht auf Anhieb sieht, welche Punkte nur er
              sieht) - bewusst NACH Profil statt davor, damit er auf Mobile konsequent als letzte
              Gruppe ganz unten landet. "Abmelden" steht bewusst NACH der Admin-Gruppe (nicht
              davor), damit es wirklich der letzte Menüpunkt ganz am Ende bleibt statt zwischen
              Profil und Admin-Gruppe eingeklemmt zu sein. Statt einer Textbeschriftung ("Admin")
              und grauer Füllung nur ein dünner roter Rahmen als dezenter, aber eindeutiger
              Hinweis. */}
          {user?.role === "admin" && (
            <>
              <span aria-hidden="true" className="mx-1 hidden h-7 w-px shrink-0 self-stretch bg-slate-300 sm:block" />
              <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-red-200 p-1">
                <Link
                  href="/admin/wissensbasis"
                  className={navLinkClassWissen(!!pathname?.startsWith("/admin/wissensbasis"))}
                >
                  <BookMarked size={16} strokeWidth={2.25} />
                  <span className="hidden sm:inline">
                    Wissensbasis{offeneWissensEntwuerfe ? ` (${offeneWissensEntwuerfe})` : ""}
                  </span>
                </Link>
                <Link
                  href="/admin"
                  title={
                    neueRegistrierungen
                      ? `${neueRegistrierungen} neue Registrierung${neueRegistrierungen === 1 ? "" : "en"}`
                      : undefined
                  }
                  className={
                    navLinkClass(
                      !!pathname?.startsWith("/admin") &&
                        !pathname?.startsWith("/admin/wissensbasis") &&
                        !pathname?.startsWith("/admin/vorfall-datenbank"),
                    ) + " relative"
                  }
                >
                  <ShieldCheck size={16} strokeWidth={2.25} />
                  <span className="hidden sm:inline">Admin</span>
                  {!!neueRegistrierungen && (
                    <span
                      aria-hidden="true"
                      className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface"
                    />
                  )}
                </Link>
                {/* Rein persönliche Lernressource für den Betreiber (Rückblick auf den DB-Vorfall
                    vom 3./4. September 2026, siehe components/VorfallDatenbankErklaerung.tsx) -
                    deshalb ganz bewusst der "warnung"-Rot-Akzent statt einer neuen Bereichsfarbe
                    wie bei Forum/Wissensbasis, da das hier kein wiederkehrender Funktionsbereich
                    ist. */}
                <Link
                  href="/admin/vorfall-datenbank"
                  title="DB-Vorfall vom 3./4. September - Rückblick"
                  className={navLinkClass(!!pathname?.startsWith("/admin/vorfall-datenbank"), true)}
                >
                  <ShieldAlert size={16} strokeWidth={2.25} />
                  <span className="hidden sm:inline">DB-Vorfall</span>
                </Link>
              </div>
            </>
          )}
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              title="Abmelden"
              aria-label="Abmelden"
              className="flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-medium text-slate-500 transition active:scale-95 sm:px-3.5 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={16} strokeWidth={2.25} />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
