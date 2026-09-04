"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import { SPIEL_FRAGEN, type SpielFrage } from "@/lib/spielFragen";

/** Wahr/Falsch-Actionspiel im Flappy-Bird-Stil: ein fliegendes Buch fällt durch Schwerkraft und
 * wird per Tippen/Leertaste nach oben "geflappt" - fliegt es beim Erreichen einer Frage-Markierung
 * in der oberen Bildschirmhälfte, zählt das als "Wahr", in der unteren Hälfte als "Falsch". Bewusst
 * KEINE physische Wand/Lücke zum Ausweichen (das wäre bei zwei gleichzeitig offenen Antwortzonen
 * auch nicht sinnvoll) - die Auflösung "richtig/falsch beantwortet" passiert rein per Spiellogik in
 * resolveHindernis(), sobald die Markierung die Vogel-X-Position erreicht. Boden/Decke-Kontakt
 * beendet das Spiel ebenfalls (klassisches Flappy-Bird-Element). Der Fragenkatalog liegt in
 * lib/spielFragen.ts. */

const BREITE = 380;
const HOEHE = 520;
const SCHWERKRAFT = 1100;
const FLAP_IMPULS = -420;
const VOGEL_X = 90;
const VOGEL_RADIUS = 16;
const START_GESCHWINDIGKEIT = 150;
const GESCHWINDIGKEIT_PRO_PUNKT = 6;
const MAX_GESCHWINDIGKEIT = 320;
const HINDERNIS_ABSTAND = 300;
const HIGHSCORE_KEY = "lernwerk_spiel_highscore";

interface Hindernis {
  x: number;
  frage: SpielFrage;
  aufgeloest: boolean;
}

type SpielStatus = "start" | "laeuft" | "vorbei";

function zufallsFrage(letzteId: string | null): SpielFrage {
  const auswahl = letzteId ? SPIEL_FRAGEN.filter((f) => f.id !== letzteId) : SPIEL_FRAGEN;
  return auswahl[Math.floor(Math.random() * auswahl.length)];
}

export default function SchulrechtRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<SpielStatus>("start");
  const [punkte, setPunkte] = useState(0);
  const [bestwert, setBestwert] = useState(0);
  const [aktuelleFrage, setAktuelleFrage] = useState<SpielFrage | null>(null);
  const [endGrund, setEndGrund] = useState<"falsch" | "absturz" | null>(null);

  const spiel = useRef({
    vogelY: HOEHE / 2,
    vogelVy: 0,
    geschwindigkeit: START_GESCHWINDIGKEIT,
    hindernisse: [] as Hindernis[],
    spawnTimer: 0,
    letzteFrageId: null as string | null,
    punkte: 0,
    flashFarbe: null as "richtig" | "falsch" | null,
    flashBis: 0,
  });

  useEffect(() => {
    try {
      const gespeichert = Number(localStorage.getItem(HIGHSCORE_KEY) ?? 0);
      if (Number.isFinite(gespeichert)) setBestwert(gespeichert);
    } catch {
      // localStorage kann in seltenen Browser-Einstellungen blockiert sein - dann bleibt der
      // Bestwert eben nur für die laufende Sitzung erhalten.
    }
  }, []);

  const spielStarten = useCallback(() => {
    const erstesHindernis: Hindernis = {
      x: BREITE + 260,
      frage: zufallsFrage(null),
      aufgeloest: false,
    };
    spiel.current = {
      vogelY: HOEHE / 2,
      vogelVy: 0,
      geschwindigkeit: START_GESCHWINDIGKEIT,
      hindernisse: [erstesHindernis],
      spawnTimer: 0,
      letzteFrageId: erstesHindernis.frage.id,
      punkte: 0,
      flashFarbe: null,
      flashBis: 0,
    };
    setPunkte(0);
    setEndGrund(null);
    setAktuelleFrage(erstesHindernis.frage);
    setStatus("laeuft");
  }, []);

  const flap = useCallback(() => {
    if (status !== "laeuft") {
      spielStarten();
    }
    // Auch der Tipp, der das Spiel (neu)startet, zählt gleich als erster Flap - sonst fällt der
    // Vogel bis zum nächsten Tipp bereits schwerkraftbedingt Richtung Boden.
    spiel.current.vogelVy = FLAP_IMPULS;
  }, [status, spielStarten]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flap]);

  useEffect(() => {
    if (status !== "laeuft") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let animationId: number;
    let letzterZeitstempel = performance.now();

    const beenden = (grund: "falsch" | "absturz") => {
      setEndGrund(grund);
      setStatus("vorbei");
      const s = spiel.current;
      setBestwert((bisher) => {
        if (s.punkte > bisher) {
          try {
            localStorage.setItem(HIGHSCORE_KEY, String(s.punkte));
          } catch {
            // siehe Kommentar oben - Speichern ist ein Nice-to-have, kein Muss.
          }
          return s.punkte;
        }
        return bisher;
      });
    };

    const frame = (jetzt: number) => {
      const dt = Math.min((jetzt - letzterZeitstempel) / 1000, 0.05);
      letzterZeitstempel = jetzt;
      const s = spiel.current;

      s.vogelVy += SCHWERKRAFT * dt;
      s.vogelY += s.vogelVy * dt;
      s.geschwindigkeit = Math.min(
        MAX_GESCHWINDIGKEIT,
        START_GESCHWINDIGKEIT + s.punkte * GESCHWINDIGKEIT_PRO_PUNKT,
      );

      for (const h of s.hindernisse) h.x -= s.geschwindigkeit * dt;
      s.hindernisse = s.hindernisse.filter((h) => h.x > -40);

      s.spawnTimer += s.geschwindigkeit * dt;
      if (s.spawnTimer >= HINDERNIS_ABSTAND) {
        s.spawnTimer = 0;
        const frage = zufallsFrage(s.letzteFrageId);
        s.letzteFrageId = frage.id;
        s.hindernisse.push({ x: BREITE + 40, frage, aufgeloest: false });
      }

      for (const h of s.hindernisse) {
        if (h.aufgeloest || h.x > VOGEL_X) continue;
        h.aufgeloest = true;
        const obenGewaehlt = s.vogelY < HOEHE / 2;
        const richtig = obenGewaehlt === h.frage.wahr;
        s.flashFarbe = richtig ? "richtig" : "falsch";
        s.flashBis = jetzt + 220;
        if (richtig) {
          s.punkte += 1;
          setPunkte(s.punkte);
          const naechstes = s.hindernisse.find((x) => !x.aufgeloest);
          setAktuelleFrage(naechstes ? naechstes.frage : null);
        } else {
          cancelAnimationFrame(animationId);
          beenden("falsch");
          return;
        }
      }

      if (s.vogelY - VOGEL_RADIUS < 0 || s.vogelY + VOGEL_RADIUS > HOEHE) {
        cancelAnimationFrame(animationId);
        beenden("absturz");
        return;
      }

      // --- Zeichnen ---
      const verlauf = ctx.createLinearGradient(0, 0, 0, HOEHE);
      verlauf.addColorStop(0, "#fffbeb");
      verlauf.addColorStop(1, "#fef3c7");
      ctx.fillStyle = verlauf;
      ctx.fillRect(0, 0, BREITE, HOEHE);

      ctx.setLineDash([6, 8]);
      ctx.strokeStyle = "rgba(180, 83, 9, 0.25)";
      ctx.beginPath();
      ctx.moveTo(0, HOEHE / 2);
      ctx.lineTo(BREITE, HOEHE / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      for (const h of s.hindernisse) {
        if (h.x < -20 || h.x > BREITE + 20) continue;
        ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
        ctx.fillRect(h.x - 4, 0, 8, HOEHE / 2);
        ctx.fillStyle = "rgba(225, 29, 72, 0.18)";
        ctx.fillRect(h.x - 4, HOEHE / 2, 8, HOEHE / 2);
      }

      ctx.font = "30px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.save();
      ctx.translate(VOGEL_X, s.vogelY);
      ctx.rotate(Math.max(-0.4, Math.min(0.9, s.vogelVy / 600)));
      ctx.fillText("📘", 0, 0);
      ctx.restore();

      if (s.flashFarbe && jetzt < s.flashBis) {
        ctx.fillStyle = s.flashFarbe === "richtig" ? "rgba(16,185,129,0.18)" : "rgba(225,29,72,0.22)";
        ctx.fillRect(0, 0, BREITE, HOEHE);
      }

      animationId = requestAnimationFrame(frame);
    };

    animationId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animationId);
  }, [status]);

  return (
    <div className="rounded-2xl border border-amber-200 bg-surface p-4 shadow-card-werkzeuge sm:p-5">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">Punkte: {punkte}</span>
        <span className="flex items-center gap-1 text-amber-700">
          <Trophy size={14} /> Bestwert: {bestwert}
        </span>
      </div>

      {status === "laeuft" && aktuelleFrage && (
        <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm font-medium text-slate-700">
          {aktuelleFrage.text}
        </div>
      )}

      <div
        className="relative mx-auto overflow-hidden rounded-xl border border-slate-200 select-none"
        style={{ maxWidth: BREITE }}
        onPointerDown={(e) => {
          e.preventDefault();
          flap();
        }}
      >
        <canvas
          ref={canvasRef}
          width={BREITE}
          height={HOEHE}
          className="block w-full touch-none"
          style={{ aspectRatio: `${BREITE} / ${HOEHE}` }}
        />

        {status !== "laeuft" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/70 p-6 text-center text-white">
            {status === "start" ? (
              <>
                <p className="font-display text-lg font-semibold">Schulrecht-Flieger</p>
                <p className="max-w-[26ch] text-sm text-slate-200">
                  Oben = Wahr, unten = Falsch. Tippen oder Leertaste zum Fliegen - triff die richtige
                  Zone, bevor die Markierung dich erreicht.
                </p>
                <p className="text-sm font-medium text-amber-300">Tippen zum Starten</p>
              </>
            ) : (
              <>
                <p className="font-display text-lg font-semibold">
                  {endGrund === "falsch" ? "Falsch beantwortet!" : "Abgestürzt!"}
                </p>
                <p className="text-sm text-slate-200">
                  {punkte} {punkte === 1 ? "Punkt" : "Punkte"}
                  {punkte >= bestwert && punkte > 0 ? " - neuer Bestwert!" : ""}
                </p>
                <p className="flex items-center gap-1.5 text-sm font-medium text-amber-300">
                  <RotateCcw size={14} /> Tippen für neuen Versuch
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-slate-400">
        Fragen zu österreichischem Schulrecht &amp; zum Aufbau des Lehrplans - einfach gehalten,
        keine Rechtsberatung.
      </p>
    </div>
  );
}
