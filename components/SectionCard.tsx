import type { LucideIcon } from "lucide-react";

const AKZENTE = {
  brand: { badge: "bg-brand-50 text-brand-600", kante: "before:bg-brand-400" },
  blau: { badge: "bg-sky-50 text-sky-600", kante: "before:bg-sky-400" },
  gold: { badge: "bg-gold-100 text-gold-700", kante: "before:bg-gold-400" },
} as const;

export default function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  akzent = "brand",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** Färbt Icon-Badge und obere Kante ein, damit mehrere SectionCards auf einer Seite (z.B.
   * Inhalt/Aufgaben/Layout im Erstellen-Formular) auf einen Blick unterscheidbar bleiben. */
  akzent?: keyof typeof AKZENTE;
}) {
  const stil = AKZENTE[akzent];
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card before:absolute before:inset-x-0 before:top-0 before:h-1.5 ${stil.kante}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stil.badge}`}>
            <Icon size={18} strokeWidth={2} />
          </span>
          <div>
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
