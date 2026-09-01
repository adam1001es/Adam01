"use client";

import { useEffect, useState } from "react";
import { getTimes } from "suncalc";
import { Sun, Moon } from "lucide-react";

const SPEICHER_SCHLUESSEL = "lernwerk-theme";
// Wien (48.2082° N, 16.3738° O) - fix statt Geolocation/Stadt-Eingabe, bewusst einfach gehalten.
const WIEN = { lat: 48.2082, lon: 16.3738 };

function wendeAn(dunkel: boolean) {
  document.documentElement.classList.toggle("dark", dunkel);
}

/** Sonne/Mond-Icon neben dem Hijri-Datum: zeigt den aktuellen Dark-Mode-Status an UND dient als
 * Toggle dafür (Klick schaltet um, Wahl wird in localStorage gemerkt). Ohne gespeicherte Wahl
 * (erster Besuch) richtet sich der Startzustand danach, ob in Wien gerade tatsächlich Tag oder
 * Nacht ist (lib suncalc, keine externe API nötig) - ab dem ersten Klick zählt nur noch die
 * eigene Wahl, unabhängig vom weiteren Sonnenstand. */
export default function ThemeToggle() {
  const [dunkel, setDunkel] = useState<boolean | null>(null);

  useEffect(() => {
    const gespeichert = localStorage.getItem(SPEICHER_SCHLUESSEL);
    if (gespeichert === "dark" || gespeichert === "light") {
      setDunkel(gespeichert === "dark");
      return;
    }
    const jetzt = new Date();
    const { sunrise, sunset } = getTimes(jetzt, WIEN.lat, WIEN.lon);
    // sunrise/sunset sind laut Typdefinition nullbar (Polartag/-nacht bei Extrembreiten) - für
    // Wien praktisch nie der Fall, aber ohne Fallback bliebe der Fall type-unsicher.
    const nachtInWien = !sunrise || !sunset || jetzt < sunrise || jetzt > sunset;
    setDunkel(nachtInWien);
    wendeAn(nachtInWien);
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
