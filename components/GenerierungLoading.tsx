"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

// Reale Reihenfolge der Erstellung (siehe lib/generateWorksheet.ts): Generierung, dann ein
// unabhängiger zweiter Prüf-Durchgang, ggf. mit automatischer Korrektur - die Texte spiegeln das
// grob wider, ohne technische Details (z.B. "Korrektur-Versuch") preiszugeben, die für Lehrkräfte
// nur verwirrend wären.
const STAGE_TEXTE = [
  "Thema wird analysiert …",
  "Aufgaben werden entworfen …",
  "Quellen werden geprüft (Koran/Hadith) …",
  "Sprache wird altersgerecht abgestimmt …",
  "Unabhängige zweite Prüfung läuft …",
  "Layout wird vorbereitet …",
];
// Ein Arbeitsblatt dauert im Schnitt ca. 3 Minuten, die tatsächliche Dauer schwankt aber spürbar
// (Bildergeschichten, ein automatischer Korrektur-Durchlauf bei "fehler" in der Verifikation, …).
// Nach der oben festen Abfolge (STAGE_TEXTE) daher NICHT bei "Gleich fertig" stehenbleiben -
// stattdessen endlos durch diesen Pool weiterwechseln, damit die Anzeige auch bei einer
// deutlich längeren Wartezeit lebendig bleibt statt eingefroren zu wirken.
const SPAET_TEXTE = ["Letzter Feinschliff …", "Gleich fertig …", "Nur noch ein Moment …", "Fast geschafft …"];

const TEXT_INTERVALL_MS = 6000;

/** Kleiner, deterministischer Pseudo-Zufallswert (0-1) statt Math.random(): diese Komponente ist
 * "use client", aber Next.js rendert den ersten Durchlauf trotzdem serverseitig vor - Math.random()
 * würde dabei serverseitig einen anderen Wert liefern als beim Hydration-Rendering im Browser und
 * so eine Hydration-Warnung auslösen. Ein einfacher linearer Kongruenzgenerator liefert stattdessen
 * für denselben "seed" immer denselben Wert, sieht dabei aber ausreichend unregelmäßig aus, um die
 * Matrix-Spalten (Position/Tempo/Startverzögerung) unterschiedlich wirken zu lassen.
 */
function pseudoZufall(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Bewusst NUR neutrale, nicht-religiöse Symbole/Ziffern für den "Matrix"-Zeicheneffekt - kein
// arabisches Schriftzeichen (auch keine harmlos wirkenden), damit nichts wie eine trivialisierende
// Verwendung von Koran-/Gebetsschrift als reines Deko-Element gelesen werden kann.
const MATRIX_GLYPHEN = ["0", "1", "◆", "✦", "✧", "▢", "⟡", "☆", "∴", "※"];
const MATRIX_SPALTEN = 12;
const MATRIX_ZEICHEN_PRO_SPALTE = 5;

/** aktiv=false (Tab im Hintergrund, siehe Sichtbarkeits-Hook unten) rendert gar keine Spalten -
 * Dutzende Elemente mit eigener endloser CSS-Animation kosten kontinuierlich Akku/GPU, genau
 * während der Wartezeit (ca. 3 Minuten) läuft aber ohnehin schon der eigentlich kritische
 * fetch()-Request. Mobile Browser (v.a. iOS Safari) werden bei einer im Hintergrund liegenden,
 * spürbar aktiven Seite eher aggressiv und drosseln/kappen dann auch Netzwerkverbindungen - dieser
 * Fall wird bereits explizit in der Fehlermeldung in NewWorksheetForm.tsx behandelt
 * ("... oder die Seite wurde in den Hintergrund gelegt"). Niemand sieht die Animation ohnehin,
 * solange der Tab nicht sichtbar ist. */
function MatrixRegen({ aktiv }: { aktiv: boolean }) {
  if (!aktiv) return null;

  const spalten = Array.from({ length: MATRIX_SPALTEN }, (_, i) => {
    const links = (i / MATRIX_SPALTEN) * 100 + pseudoZufall(i) * (100 / MATRIX_SPALTEN) * 0.6;
    const dauer = 2.6 + pseudoZufall(i + 100) * 2.4;
    const verzoegerung = pseudoZufall(i + 200) * 3;
    const zeichen = Array.from(
      { length: MATRIX_ZEICHEN_PRO_SPALTE },
      (_, z) => MATRIX_GLYPHEN[Math.floor(pseudoZufall(i * 7 + z) * MATRIX_GLYPHEN.length)],
    );
    return { links, dauer, verzoegerung, zeichen };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden" aria-hidden>
      {spalten.map((spalte, i) => (
        <div
          key={i}
          className="animate-matrix-fall absolute top-0 flex flex-col items-center gap-2.5 font-mono text-[11px] leading-none text-brand-200/70"
          style={{
            left: `${spalte.links}%`,
            animationDuration: `${spalte.dauer}s`,
            animationDelay: `${spalte.verzoegerung}s`,
          }}
        >
          {spalte.zeichen.map((z, zi) => (
            <span key={zi}>{z}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

// Zielbreiten der "Textzeilen" auf dem sich zusammensetzenden Glas-Blatt - unterschiedlich lang,
// damit es wie echter Fließtext statt gleichförmiger Balken wirkt.
const GLAS_ZEILEN_BREITEN = [92, 76, 88, 64, 90, 72];

/** Lade-Anzeige während der (teils minutenlangen) Arbeitsblatt-Erstellung - als zentriertes Popup
 * über der gesamten Ansicht (statt nur inline anstelle des Erstellen-Buttons), damit sie besonders
 * auf dem Handy wie ein echtes, mittig sitzendes Overlay wirkt und nicht irgendwo im Formular
 * verschwindet, wenn man beim Auslösen bereits weiter unten gescrollt hatte. Sperrt währenddessen
 * das Scrollen der Seite dahinter (klassisches Popup-Verhalten). Zeigt ein "Glas"-Blatt, auf dem
 * sich laufend neue Zeilen aufbauen, mit einem dezenten, futuristischen Zeichen-Regen im
 * Hintergrund - bei einer durchschnittlichen Wartezeit von ca. 3 Minuten (siehe STAGE_TEXTE/
 * SPAET_TEXTE oben) soll hier erkennbar etwas passieren statt einer stillstehenden Balkenanzeige.
 */
export default function GenerierungLoading() {
  const [tick, setTick] = useState(0);
  // Startwert bewusst "true": beim ersten Rendern (Aufruf gerade erst per Klick ausgelöst) ist die
  // Seite immer sichtbar - document.hidden erst NACH der Hydration abzufragen vermeidet einen
  // Server/Client-Unterschied beim ersten Render.
  const [sichtbar, setSichtbar] = useState(true);

  useEffect(() => {
    const intervall = setInterval(() => setTick((t) => t + 1), TEXT_INTERVALL_MS);
    return () => clearInterval(intervall);
  }, []);

  // Läuft die Seite im Hintergrund (Tab gewechselt, Bildschirm gesperrt, App minimiert), laufende
  // Animationen abschalten statt die ganzen ca. 3 Minuten durchlaufen zu lassen - siehe
  // Begründung bei MatrixRegen oben. Betrifft NUR die Optik, nicht den eigentlichen fetch()-Request
  // in NewWorksheetForm.tsx (der läuft unabhängig davon weiter).
  useEffect(() => {
    setSichtbar(!document.hidden);
    function aufSichtbarkeitswechsel() {
      setSichtbar(!document.hidden);
    }
    document.addEventListener("visibilitychange", aufSichtbarkeitswechsel);
    return () => document.removeEventListener("visibilitychange", aufSichtbarkeitswechsel);
  }, []);

  // Body-Scroll sperren, solange das Popup sichtbar ist - typisches Modal-Verhalten, verhindert
  // dass man die Seite dahinter versehentlich wegscrollt. Ursprünglichen Wert beim Aufräumen
  // wiederherstellen statt hart auf "" zu setzen, falls schon vorher etwas anderes galt.
  useEffect(() => {
    const vorher = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = vorher;
    };
  }, []);

  const text =
    tick < STAGE_TEXTE.length ? STAGE_TEXTE[tick] : SPAET_TEXTE[(tick - STAGE_TEXTE.length) % SPAET_TEXTE.length];

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-white/40 p-4 backdrop-blur-md backdrop-saturate-150">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-brand-800/40 bg-gradient-to-br from-[#0b1f1c] via-[#0f2e29] to-[#0b1f1c] px-5 py-6 shadow-2xl">
        <MatrixRegen aktiv={sichtbar} />

        <div className="relative mx-auto w-full max-w-[240px] rounded-xl border border-white/15 bg-white/10 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <div className="mb-3 flex items-center gap-1.5">
            <Sparkles size={14} className={`text-gold-300 ${sichtbar ? "animate-pulse" : ""}`} />
            <span className="text-[11px] font-medium tracking-wide text-white/80">Bismillahirrahmanirrahim</span>
          </div>
          {GLAS_ZEILEN_BREITEN.map((breite, i) => (
            <div
              key={i}
              className={`mb-2 h-1.5 rounded-full bg-white/40 last:mb-0 motion-reduce:w-full ${
                sichtbar ? "animate-glass-line motion-reduce:animate-none" : "w-full"
              }`}
              style={{ "--zeilenbreite": `${breite}%`, animationDelay: `${i * 0.35}s` } as React.CSSProperties}
            />
          ))}
        </div>

        <p key={tick} className={`relative mt-4 text-center text-sm font-medium text-white/90 ${sichtbar ? "animate-fade-in" : ""}`}>
          {text}
        </p>

        <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-gold-300 to-brand-300 motion-reduce:w-full ${
              sichtbar ? "animate-lade-balken motion-reduce:animate-none" : ""
            }`}
          />
        </div>
      </div>
    </div>
  );
}
