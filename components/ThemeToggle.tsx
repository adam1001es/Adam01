"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const SPEICHER_SCHLUESSEL = "lernwerk-theme";

function wendeAn(dunkel: boolean) {
  document.documentElement.classList.toggle("dark", dunkel);
}

/** Manueller Dark-Mode-Schalter neben dem Hijri-Datum - schaltet sich NIE von selbst ein (auch
 * nicht nach System-Präferenz oder Tageszeit): Start ist immer hell, außer die Person hat schon
 * einmal selbst auf Dunkel umgeschaltet (siehe SPEICHER_SCHLUESSEL). Bewusst getrennt von
 * components/SonnenuntergangAnzeige.tsx, die nur eine Info-Anzeige ist, kein Schalter. */
export default function ThemeToggle() {
  const [dunkel, setDunkel] = useState<boolean | null>(null);

  useEffect(() => {
    const gespeichert = localStorage.getItem(SPEICHER_SCHLUESSEL);
    const istDunkel = gespeichert === "dark";
    setDunkel(istDunkel);
    // Deckt v.a. den Fall ab, dass das Blocking-Script in layout.tsx aus irgendeinem Grund nicht
    // lief (z.B. deaktiviertes JS beim ersten Server-Render) - im Normalfall steht die Klasse
    // schon korrekt, dieser Aufruf ist dann ein No-op.
    wendeAn(istDunkel);
  }, []);

  function toggle() {
    const naechsterWert = !dunkel;
    setDunkel(naechsterWert);
    wendeAn(naechsterWert);
    localStorage.setItem(SPEICHER_SCHLUESSEL, naechsterWert ? "dark" : "light");
  }

  // Vor der ersten Berechnung (SSR/erster Render) noch kein Icon zeigen, um kein falsches
  // Sonne/Mond-Flackern zu riskieren - die Fläche bleibt einfach leer, kaum wahrnehmbar bei
  // so einem kleinen Icon.
  if (dunkel === null) return <span className="inline-block h-[15px] w-[15px]" aria-hidden />;

  return (
    <button
      type="button"
      onClick={toggle}
      title={dunkel ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren"}
      aria-label={dunkel ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren"}
      className="inline-flex items-center justify-center rounded-full p-1 text-gold-700 transition hover:bg-gold-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {dunkel ? <Moon size={14} strokeWidth={2.25} /> : <Sun size={14} strokeWidth={2.25} />}
    </button>
  );
}
