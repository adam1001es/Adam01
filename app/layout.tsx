import type { Metadata } from "next";
import Script from "next/script";
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
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
  // Nur für Admins abgefragt (auf jeder Seite gerendert, siehe SiteHeader unten) - eine
  // ungenutzte Zählabfrage für alle anderen Nutzer:innen wäre reine Verschwendung.
  const offeneWissensEntwuerfe =
    user?.role === "admin"
      ? await prisma.wissensEintrag.count({ where: { status: "entwurf" } })
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
          user={
            user
              ? {
                  email: user.email,
                  username: user.username,
                  role: user.role,
                  istZahlend: istZahlendesKonto(user),
                  avatarFarbe: user.avatarFarbe,
                  avatarTextFarbe: user.avatarTextFarbe,
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
