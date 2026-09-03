"use client";

import { useState, cloneElement, isValidElement } from "react";
import { ChevronDown } from "lucide-react";
import { SEKTION_FARBEN, SektionAkzent } from "@/lib/sectionFarben";

/** Wie SectionCard, aber zugeklappt startend und per Klick auf den Kopfbereich auf-/zuklappbar -
 * für Profil-Abschnitte in app/account, die nicht ständig offen herumstehen müssen (Avatar,
 * Unterrichtsprofil, Statistik). Nimmt bewusst ein bereits gerendertes Icon-Element (kein
 * Komponenten-Verweis wie bei SectionCard) entgegen, weil diese Karte als Client Component aus
 * einer Server Component (app/account/page.tsx) heraus befüllt wird - nur fertige Elemente lassen
 * sich über diese Grenze reichen, keine rohen Funktionsverweise (auch "children" darf deshalb kein
 * Render-Prop sein, siehe autoCollapseAfterSave unten). */
export default function EinklappbareSectionCard({
  icon,
  title,
  subtitle,
  akzent = "brand",
  autoCollapseAfterSave = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  akzent?: SektionAkzent;
  /** Klappt die Karte automatisch wieder zu, kurz nachdem im (einzigen) Kind-Formular erfolgreich
   * gespeichert wurde - dafür wird dem Kind-Element rein client-seitig (per cloneElement, NICHT
   * über eine Server->Client-Grenze) eine onGespeichert-Prop untergeschoben. Nur für Karten mit
   * genau einem Formular als Kind sinnvoll (Avatar, Unterrichtsprofil) - bei reinen
   * Info-Karten (z.B. Statistik) weglassen. */
  autoCollapseAfterSave?: boolean;
  children: React.ReactNode;
}) {
  const [offen, setOffen] = useState(false);
  const stil = SEKTION_FARBEN[akzent];

  const inhalt =
    autoCollapseAfterSave && isValidElement(children)
      ? cloneElement(children as React.ReactElement<{ onGespeichert?: () => void }>, {
          onGespeichert: () => setOffen(false),
        })
      : children;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-slate-200 border-l-4 bg-surface shadow-card ${stil.kante}`}
    >
      {/* Wie SectionCard: dezenter, an der Kante verankerter Farbschimmer - siehe dort für Details. */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${stil.wash} to-transparent`} />
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        className="relative flex w-full items-center justify-between gap-3 p-6 text-left"
      >
        <div className="flex items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stil.badge}`}>
            {icon}
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-800">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`mt-1 shrink-0 text-slate-400 transition-transform ${offen ? "rotate-180" : ""}`}
        />
      </button>
      {offen && <div className="relative px-6 pb-6">{inhalt}</div>}
    </section>
  );
}
