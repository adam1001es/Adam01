"use client";

import { useEffect, useState } from "react";

const STATUS_TEXTE_TEXT = [
  "Aufgaben werden erstellt …",
  "Inhalte werden pädagogisch geprüft …",
  "Quellenangaben werden gegengecheckt …",
  "Gleich fertig …",
];

const STATUS_TEXTE_MIT_BILDERN = [
  "Aufgaben werden erstellt …",
  "Bilder werden per KI generiert …",
  "Inhalte werden pädagogisch geprüft …",
  "Bilder werden sicherheitsgeprüft …",
  "Gleich fertig …",
];

/** Vollflächige Lade-Ansicht während der (teils minutenlangen) Arbeitsblatt-Erstellung - die
 * Basmala als ruhiger, thematisch passender Blickfang statt eines anonymen Spinners, plus
 * rotierende Status-Texte, damit die Wartezeit nicht wie ein eingefrorener Bildschirm wirkt. */
export default function GenerierungLoading({ mitBildern }: { mitBildern: boolean }) {
  const texte = mitBildern ? STATUS_TEXTE_MIT_BILDERN : STATUS_TEXTE_TEXT;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const intervall = setInterval(() => {
      setIndex((i) => Math.min(i + 1, texte.length - 1));
    }, 4500);
    return () => clearInterval(intervall);
  }, [texte.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/90 backdrop-blur-sm">
      <div className="mx-4 flex max-w-md flex-col items-center rounded-3xl border border-gold-200 bg-white px-8 py-10 text-center shadow-card-hover">
        <div className="animate-basmala-in">
          <div className="animate-basmala-breathe">
            <p
              dir="rtl"
              lang="ar"
              className="bg-gradient-to-r from-gold-500 via-gold-200 to-gold-500 bg-[length:200%_100%] bg-clip-text font-arabic text-4xl leading-relaxed text-transparent animate-shimmer sm:text-5xl"
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400">Im Namen Allahs, des Allerbarmers, des Barmherzigen</p>

        <div className="mt-7 flex items-center gap-2.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" />
        </div>
        <p className="mt-4 min-h-[1.5em] text-sm font-medium text-slate-600">{texte[index]}</p>
        <p className="mt-1 text-xs text-slate-400">Das kann bis zu ein paar Minuten dauern.</p>
      </div>
    </div>
  );
}
