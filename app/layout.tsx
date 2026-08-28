import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="de">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <header className="no-print mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
            <a href="/" className="text-lg font-semibold text-brand-700">
              📘 Arbeitsblatt-Generator
            </a>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:text-brand-600">
                Übersicht
              </a>
              <a
                href="/new"
                className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
              >
                + Neues Arbeitsblatt
              </a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
