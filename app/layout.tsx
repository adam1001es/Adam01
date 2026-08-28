import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

const display = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Arbeitsblatt-Generator",
  description: "Automatische Erstellung und Prüfung von Arbeitsblättern",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-slate-900">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </body>
    </html>
  );
}
