"use client";

import { useEffect, useState } from "react";

const STATUS_TEXTE = [
  "Arbeitsblatt wird erstellt …",
  "Inhalte werden pädagogisch geprüft …",
  "Gleich fertig …",
];

/** Kompakte Lade-Anzeige während der (teils minutenlangen) Arbeitsblatt-Erstellung - ersetzt
 * nur den Erstellen-Button, kein vollflächiges Overlay. "Bismillahirrahmanirrahim" bewusst nur
 * als schlichte Umschrift, keine arabische Kalligrafie/Übersetzung nötig. */
export default function GenerierungLoading() {
  const texte = STATUS_TEXTE;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const intervall = setInterval(() => {
      setIndex((i) => Math.min(i + 1, texte.length - 1));
    }, 4500);
    return () => clearInterval(intervall);
  }, [texte.length]);

  return (
    <div className="rounded-xl border border-gold-200 bg-gradient-to-br from-gold-50 to-white px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-gold-700">Bismillahirrahmanirrahim</span>
        <span className="text-xs text-slate-500">{texte[index]}</span>
      </div>
      <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gold-100">
        <div className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 animate-lade-balken" />
      </div>
    </div>
  );
}
