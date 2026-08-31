import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { getSessionUser } from "@/lib/auth";

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
  title: "Arbeitsblatt-Generator",
  description: BESCHREIBUNG,
  openGraph: {
    title: "Arbeitsblatt-Generator",
    description: BESCHREIBUNG,
    url: SITE_URL,
    siteName: "Arbeitsblatt-Generator",
    locale: "de_AT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arbeitsblatt-Generator",
    description: BESCHREIBUNG,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="de" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-slate-900">
        <SiteHeader
          user={user ? { email: user.email, username: user.username, role: user.role } : null}
        />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </body>
    </html>
  );
}
