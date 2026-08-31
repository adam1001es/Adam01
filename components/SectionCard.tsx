import type { LucideIcon } from "lucide-react";
import { SEKTION_FARBEN, SektionAkzent } from "@/lib/sectionFarben";

export default function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  akzent = "brand",
  schritt,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** Färbt Badge, linke Kante und alle auswählbaren Chips/Buttons innerhalb der Karte ein, damit
   * mehrere SectionCards auf einer Seite (z.B. Inhalt/Aufgaben/Layout im Erstellen-Formular) auf
   * einen Blick unterscheidbar bleiben - siehe lib/sectionFarben.ts für die Chip-Farben selbst. */
  akzent?: SektionAkzent;
  /** Optionale Schritt-Nummer (z.B. 1 von 3) - macht bei einer mehrteiligen Abfolge wie
   * Inhalt→Aufgaben→Layout die Reihenfolge auf einen Blick klar. */
  schritt?: { nr: number; von: number };
}) {
  const stil = SEKTION_FARBEN[akzent];
  return (
    <section
      className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-6 shadow-card ${stil.kante}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stil.badge}`}>
            <Icon size={18} strokeWidth={2} />
          </span>
          <div>
            {schritt && (
              <span className={`block text-[11px] font-semibold uppercase tracking-wide ${stil.boxLabel}`}>
                Schritt {schritt.nr} von {schritt.von}
              </span>
            )}
            <h2 className="font-display text-lg font-semibold text-slate-800">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
