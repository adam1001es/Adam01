"use client";

/** Next.js rendert diese Datei automatisch zwischen layout.tsx und der jeweiligen Seite und
 * MOUNTET SIE NEU bei jeder Navigation (im Gegensatz zu layout.tsx, das erhalten bleibt) -
 * genau dafür gedacht, ein dezentes Einblenden beim Seitenwechsel zu erzeugen, ohne eine eigene
 * Animations-Bibliothek zu brauchen (siehe "fade-in" in tailwind.config.ts). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
