"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown } from "lucide-react";
import type { Verification } from "@/lib/types";

const VERIFICATION_STYLE: Record<
  Verification["status"],
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  ok: {
    label: "Geprüft – keine relevanten Probleme gefunden",
    className: "bg-brand-50 border-brand-200 text-brand-800",
    icon: CheckCircle2,
  },
  warnung: {
    label: "Bitte vor Einsatz gegenprüfen",
    className: "bg-amber-50 border-amber-200 text-amber-800",
    icon: AlertTriangle,
  },
  fehler: {
    label: "Überarbeitung empfohlen, bevor das Blatt verwendet wird",
    className: "bg-red-50 border-red-200 text-red-800",
    icon: XCircle,
  },
};

/** Zeigt das Prüfungsergebnis kompakt an - immer eingeklappt, auch bei "warnung"/"fehler",
 * damit die oft lange Liste an Hinweisen nicht jedes Mal den Blick auf das eigentliche
 * Arbeitsblatt verstellt. Die Lehrkraft klappt bei Bedarf über den Pfeil selbst auf. */
export default function VerificationBanner({ verification }: { verification: Verification }) {
  const [offen, setOffen] = useState(false);
  const vStyle = VERIFICATION_STYLE[verification.status];
  const VIcon = vStyle.icon;

  return (
    <div className={`no-print mb-6 rounded-xl border text-sm shadow-sm ${vStyle.className}`}>
      <button
        type="button"
        onClick={() => setOffen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <VIcon size={19} className="shrink-0" />
        <span className="flex-1 font-medium">{vStyle.label}</span>
        <ChevronDown
          size={17}
          className={`shrink-0 transition-transform ${offen ? "rotate-180" : ""}`}
        />
      </button>
      {offen && (
        <div className="px-4 pb-4 pl-[2.7rem]">
          <p>{verification.zusammenfassung}</p>
          {verification.hinweise.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5">
              {verification.hinweise.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
