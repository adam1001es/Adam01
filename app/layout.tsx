import type { Metadata } from "next";
import { Newsreader, Inter, Amiri } from "next/font/google";
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

// Für arabische Schrift (z.B. die Basmala in GenerierungLoading.tsx) - Newsreader/Inter decken
// arabische Glyphen nicht ab. Amiri ist eine klassische Naskh-Schriftart, wie sie traditionell
// für Koran-/religiöse Texte verwendet wird.
const arabic = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "Arbeitsblatt-Generator",
  description: "Automatische Erstellung und Prüfung von Arbeitsblättern",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="de" className={`${display.variable} ${sans.variable} ${arabic.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-slate-900">
        <SiteHeader
          user={user ? { email: user.email, username: user.username, role: user.role } : null}
        />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </body>
    </html>
  );
}
