import type { Metadata } from "next";
import Script from "next/script";
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { hatModRechte } from "@/lib/rollen";
import { toHijri } from "@/lib/hijri";
import { prisma } from "@/lib/prisma";

const display = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const SITE_URL = "https://ki.islamlernen.at";
const BESCHREIBUNG =
  "Automatische Erstellung und pädagogische Prüfung von Arbeitsblättern für den islamischen Religionsunterricht an österreichischen Schulen.";

// metadataBase + openGraph/twitter sorgen dafür, dass ein geteilter Link (z.B. bei WhatsApp)
// eine Vorschaukarte mit Bild statt nur nacktem Text zeigt - das Bild selbst kommt aus
// app/opengraph-image.tsx bzw. app/twitter-image.tsx (Next.js bindet diese automatisch ein).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Lernwerk",
  description: BESCHREIBUNG,
  openGraph: {
    title: "Lernwerk",
    description: BESCHREIBUNG,
    url: SITE_URL,
    siteName: "Lernwerk",
    locale: "de_AT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lernwerk",
    description: BESCHREIBUNG,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const hijriDatum = toHijri(new Date()).label;
  // Für Admins UND Moderator:innen abgefragt (auf jeder Seite gerendert, siehe SiteHeader unten)
  // - eine ungenutzte Zählabfrage für alle anderen Nutzer:innen wäre reine Verschwendung. Beide
  // Rollen dürfen Wissensbasis-Einträge prüfen/freigeben (siehe lib/rollen.ts).
  const offeneWissensEntwuerfe =
    user && hatModRechte(user)
      ? await prisma.wissensEintrag.count({ where: { status: "entwurf" } })
      : undefined;
  // Neue Registrierungen seit dem letzten Besuch von app/admin - siehe User.letzteKontenAnsicht
  // im Prisma-Schema, als kleiner Punkt am Admin-Icon (siehe SiteHeader.tsx). Admin-exklusiv (nur
  // Admins sehen die Kontenverwaltung überhaupt).
  const neueRegistrierungen =
    user?.role === "admin"
      ? await prisma.user.count({ where: { createdAt: { gt: user.letzteKontenAnsicht } } })
      : undefined;
  // Für den "Moderation"-Nav-Punkt (nur Moderator:innen - Admins haben ihre eigenen Badges direkt
  // auf app/admin, siehe dort) - Summe aus beiden Meldungsarten als ein Punkt/Zahl, analog zu
  // neueRegistrierungen.
  const offeneModerationsMeldungen =
    user?.role === "moderator"
      ? await (async () => {
          const [offeneMeldungen, offeneForumMeldungen] = await Promise.all([
            prisma.meldung.count({ where: { bearbeitet: false } }),
            prisma.forumMeldung.count({ where: { bearbeitet: false } }),
          ]);
          return offeneMeldungen + offeneForumMeldungen;
        })()
      : undefined;
  // Neu geteilte Arbeitsblätter seit dem letzten Besuch von app/community - für ALLE Konten
  // (nicht nur Admin), siehe User.letzteCommunityAnsicht im Prisma-Schema. Eigene Arbeitsblätter
  // zählen nicht mit (man muss sich nicht selbst über den eigenen Beitrag benachrichtigen).
  const neueCommunityBeitraege = user
    ? await prisma.worksheet.count({
        where: {
          geteilt: true,
          userId: { not: user.id },
          geteiltAm: { gt: user.letzteCommunityAnsicht },
        },
      })
    : undefined;

  return (
    <html lang="de" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-slate-900">
        {/* Setzt die .dark-Klasse VOR dem ersten Paint (siehe components/ThemeToggle.tsx) - ohne
            das würde bei gespeichertem Dark-Mode-Wunsch kurz die helle Seite aufblitzen, bevor
            React hydriert. "beforeInteractive" landet unabhängig von der Platzierung im
            HTML-<head> (Next.js-Verhalten). Dark Mode schaltet sich NIE von selbst ein - weder
            nach System-Präferenz noch nach Tageszeit: nur eine explizit gespeicherte "dark"-Wahl
            (durch Klick auf ThemeToggle) aktiviert ihn, sonst bleibt es immer hell. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{if(localStorage.getItem("lernwerk-theme")==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`}
        </Script>
        <SiteHeader
          hijriDatum={hijriDatum}
          offeneWissensEntwuerfe={offeneWissensEntwuerfe}
          neueRegistrierungen={neueRegistrierungen}
          offeneModerationsMeldungen={offeneModerationsMeldungen}
          neueCommunityBeitraege={neueCommunityBeitraege}
          user={
            user
              ? {
                  email: user.email,
                  username: user.username,
                  role: user.role,
                  istZahlend: istZahlendesKonto(user),
                  avatarFarbe: user.avatarFarbe,
                  avatarTextFarbe: user.avatarTextFarbe,
                  avatarKuerzel: user.avatarKuerzel,
                  status: user.status,
                }
              : null
          }
        />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
