"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import { SPIEL_FRAGEN, type SpielFrage } from "@/lib/spielFragen";
import {
  type Formteil,
  dreiAuswahlFormen,
  formGroesse,
  zufallsFarbe,
  zufallsSchwereForm,
} from "@/lib/blockFormen";

/** Kästchen-Puzzle statt Reflexspiel (siehe SchulrechtRunner-Vorgänger - dessen Grundproblem war,
 * dass Lesen+Verstehen einer Frage und gleichzeitige Reflexsteuerung sich gegenseitig ausschließen).
 * Hier gibt es KEINEN Zeitdruck: das Spiel ist rundenbasiert - Frage in Ruhe beantworten, dann in
 * Ruhe ein Kästchen im Raster platzieren. Richtig beantwortet -> freie Auswahl aus 3 Formen,
 * falsch -> eine zufällige "schwere" (größere/unregelmäßige) Form wird ungefragt zugewiesen. Eine
 * volle Zeile ODER Spalte löst sich auf (wie bei "1010!"/"Block Blast", NICHT wie Tetris - keine
 * fallenden Steine, keine Rotation). Game Over, sobald die zugewiesene Form nirgendwo mehr ins
 * Raster passt. */

const RASTER_GROESSE = 8;
const ZEILEN_PRO_LEVEL = 5;
const HIGHSCORE_KEY = "lernwerk_bloecke_highscore";

type Phase = "start" | "frage" | "waehlen" | "platzieren" | "ende";
type Raster = (string | null)[][];
interface FormMitFarbe {
  form: Formteil;
  farbe: string;
}

function leeresRaster(): Raster {
  return Array.from({ length: RASTER_GROESSE }, () => Array<string | null>(RASTER_GROESSE).fill(null));
}

function passtAn(raster: Raster, form: Formteil, ankerR: number, ankerC: number): boolean {
  return form.zellen.every(([dr, dc]) => {
    const r = ankerR + dr;
    const c = ankerC + dc;
    return r >= 0 && r < RASTER_GROESSE && c >= 0 && c < RASTER_GROESSE && raster[r][c] === null;
  });
}

function findeGueltigenAnker(raster: Raster, form: Formteil): boolean {
  for (let r = 0; r < RASTER_GROESSE; r++) {
    for (let c = 0; c < RASTER_GROESSE; c++) {
      if (passtAn(raster, form, r, c)) return true;
    }
  }
  return false;
}

function zufallsFrage(letzteId: string | null): SpielFrage {
  const auswahl = letzteId ? SPIEL_FRAGEN.filter((f) => f.id !== letzteId) : SPIEL_FRAGEN;
  return auswahl[Math.floor(Math.random() * auswahl.length)];
}

export default function WissensBloecke() {
  const [raster, setRaster] = useState<Raster>(leeresRaster);
  const [phase, setPhase] = useState<Phase>("start");
  const [frage, setFrage] = useState<SpielFrage | null>(null);
  const [letzteFrageId, setLetzteFrageId] = useState<string | null>(null);
  const [auswahlOptionen, setAuswahlOptionen] = useState<FormMitFarbe[]>([]);
  const [aktuellesStueck, setAktuellesStueck] = useState<FormMitFarbe | null>(null);
  const [score, setScore] = useState(0);
  const [zeilenGeloescht, setZeilenGeloescht] = useState(0);
  const [bestwert, setBestwert] = useState(0);
  const [levelToast, setLevelToast] = useState(false);
  const [ungueltigeZelle, setUngueltigeZelle] = useState<string | null>(null);
  const [hoverAnker, setHoverAnker] = useState<{ r: number; c: number } | null>(null);

  useEffect(() => {
    try {
      const gespeichert = Number(localStorage.getItem(HIGHSCORE_KEY) ?? 0);
      if (Number.isFinite(gespeichert)) setBestwert(gespeichert);
    } catch {
      // localStorage kann in seltenen Browser-Einstellungen blockiert sein - dann bleibt der
      // Bestwert eben nur für die laufende Sitzung erhalten.
    }
  }, []);

  const level = Math.floor(zeilenGeloescht / ZEILEN_PRO_LEVEL) + 1;

  const naechsteFrage = useCallback((letzte: string | null) => {
    const f = zufallsFrage(letzte);
    setLetzteFrageId(f.id);
    setFrage(f);
    setPhase("frage");
  }, []);

  const stueckSetzenUndPruefen = useCallback(
    (kandidat: FormMitFarbe, aktuellerRaster: Raster) => {
      setAktuellesStueck(kandidat);
      if (!findeGueltigenAnker(aktuellerRaster, kandidat.form)) {
        setPhase("ende");
        setBestwert((bisher) => {
          if (score > bisher) {
            try {
              localStorage.setItem(HIGHSCORE_KEY, String(score));
            } catch {
              // siehe Kommentar oben.
            }
            return score;
          }
          return bisher;
        });
        return;
      }
      setPhase("platzieren");
    },
    [score],
  );

  const spielStarten = useCallback(() => {
    setRaster(leeresRaster());
    setScore(0);
    setZeilenGeloescht(0);
    setAktuellesStueck(null);
    setAuswahlOptionen([]);
    setHoverAnker(null);
    naechsteFrage(null);
  }, [naechsteFrage]);

  const antworten = useCallback(
    (gewaehlt: boolean) => {
      if (!frage) return;
      const richtig = gewaehlt === frage.wahr;
      if (richtig) {
        setAuswahlOptionen(dreiAuswahlFormen().map((form) => ({ form, farbe: zufallsFarbe() })));
        setPhase("waehlen");
      } else {
        stueckSetzenUndPruefen({ form: zufallsSchwereForm(), farbe: zufallsFarbe() }, raster);
      }
    },
    [frage, raster, stueckSetzenUndPruefen],
  );

  const formWaehlen = useCallback(
    (option: FormMitFarbe) => {
      stueckSetzenUndPruefen(option, raster);
    },
    [raster, stueckSetzenUndPruefen],
  );

  const zellKlick = useCallback(
    (r: number, c: number) => {
      if (phase !== "platzieren" || !aktuellesStueck) return;
      if (!passtAn(raster, aktuellesStueck.form, r, c)) {
        setUngueltigeZelle(`${r}-${c}`);
        setTimeout(() => setUngueltigeZelle(null), 300);
        return;
      }

      const neu = raster.map((row) => row.slice());
      for (const [dr, dc] of aktuellesStueck.form.zellen) {
        neu[r + dr][c + dc] = aktuellesStueck.farbe;
      }

      const vollZeilen = [...Array(RASTER_GROESSE).keys()].filter((rr) => neu[rr].every((z) => z !== null));
      const vollSpalten = [...Array(RASTER_GROESSE).keys()].filter((cc) => neu.every((row) => row[cc] !== null));
      vollZeilen.forEach((rr) => neu[rr].fill(null));
      vollSpalten.forEach((cc) => neu.forEach((row) => (row[cc] = null)));
      const geloescht = vollZeilen.length + vollSpalten.length;

      const neuerScore = score + aktuellesStueck.form.zellen.length + geloescht * 10;
      const neuesZeilenTotal = zeilenGeloescht + geloescht;
      const vorherigesLevel = Math.floor(zeilenGeloescht / ZEILEN_PRO_LEVEL);
      const neuesLevel = Math.floor(neuesZeilenTotal / ZEILEN_PRO_LEVEL);

      setRaster(neu);
      setScore(neuerScore);
      setZeilenGeloescht(neuesZeilenTotal);
      setAktuellesStueck(null);
      setHoverAnker(null);

      if (neuesLevel > vorherigesLevel) {
        setLevelToast(true);
        setTimeout(() => setLevelToast(false), 1800);
      }

      naechsteFrage(letzteFrageId);
    },
    [phase, aktuellesStueck, raster, score, zeilenGeloescht, letzteFrageId, naechsteFrage],
  );

  const vorschau = useMemo(() => {
    if (phase !== "platzieren" || !aktuellesStueck || !hoverAnker) return null;
    const gueltig = passtAn(raster, aktuellesStueck.form, hoverAnker.r, hoverAnker.c);
    const zellen = new Set(
      aktuellesStueck.form.zellen.map(([dr, dc]) => `${hoverAnker.r + dr}-${hoverAnker.c + dc}`),
    );
    return { zellen, gueltig };
  }, [phase, aktuellesStueck, hoverAnker, raster]);

  return (
    <div className="rounded-2xl border border-amber-200 bg-surface p-4 shadow-card-werkzeuge sm:p-5">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">Punkte: {score}</span>
        <span className="text-slate-500">Level {level}</span>
        <span className="flex items-center gap-1 text-amber-700">
          <Trophy size={14} /> Bestwert: {bestwert}
        </span>
      </div>

      {phase === "start" ? (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-8 text-center">
          <p className="font-display text-lg font-semibold text-slate-800">Wissensblöcke</p>
          <p className="mx-auto mt-2 max-w-[32ch] text-sm text-slate-600">
            Beantworte die Frage, platziere dein Kästchen im Raster - eine volle Reihe oder Spalte
            löst sich auf. Kein Zeitdruck, du entscheidest in Ruhe.
          </p>
          <button
            type="button"
            onClick={spielStarten}
            className="mt-4 rounded-lg bg-werkzeuge-gradient px-5 py-2.5 text-sm font-medium text-white shadow-card-werkzeuge"
          >
            Spiel starten
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            {levelToast && (
              <div className="absolute inset-x-0 -top-2 z-10 mx-auto w-fit rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white shadow-card">
                Level {level} erreicht!
              </div>
            )}
            <div
              className="mx-auto grid gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2"
              style={{ gridTemplateColumns: `repeat(${RASTER_GROESSE}, 1fr)`, maxWidth: 360 }}
              onMouseLeave={() => setHoverAnker(null)}
            >
              {raster.map((row, r) =>
                row.map((zelle, c) => {
                  const key = `${r}-${c}`;
                  const invalid = ungueltigeZelle === key;
                  const previewHit = vorschau?.zellen.has(key) ?? false;
                  let hintergrund = "#e2e8f0";
                  if (zelle) hintergrund = zelle;
                  else if (previewHit) hintergrund = vorschau?.gueltig ? "#86efac" : "#fecaca";
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={phase !== "platzieren"}
                      onClick={() => zellKlick(r, c)}
                      onMouseEnter={() => phase === "platzieren" && setHoverAnker({ r, c })}
                      className={`aspect-square rounded-md transition-colors ${invalid ? "animate-pulse" : ""}`}
                      style={{ backgroundColor: invalid ? "#fca5a5" : hintergrund }}
                    />
                  );
                }),
              )}
            </div>
          </div>

          <div className="mt-4">
            {phase === "frage" && frage && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                <p className="text-sm font-medium text-slate-700">{frage.text}</p>
                <div className="mt-3 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => antworten(true)}
                    className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    Wahr
                  </button>
                  <button
                    type="button"
                    onClick={() => antworten(false)}
                    className="rounded-lg bg-rose-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700"
                  >
                    Falsch
                  </button>
                </div>
              </div>
            )}

            {phase === "waehlen" && (
              <div className="text-center">
                <p className="mb-2 text-sm font-medium text-emerald-700">Richtig! Wähle dein Kästchen:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {auswahlOptionen.map((option, i) => (
                    <FormVorschau key={i} form={option.form} farbe={option.farbe} onClick={() => formWaehlen(option)} />
                  ))}
                </div>
              </div>
            )}

            {phase === "platzieren" && aktuellesStueck && (
              <div className="text-center">
                <p className="mb-2 text-sm text-slate-500">Tippe im Raster, um zu platzieren:</p>
                <FormVorschau form={aktuellesStueck.form} farbe={aktuellesStueck.farbe} />
              </div>
            )}

            {phase === "ende" && (
              <div className="text-center">
                <p className="font-display text-lg font-semibold text-slate-800">Kein Platz mehr!</p>
                <p className="mt-1 text-sm text-slate-500">
                  {score} {score === 1 ? "Punkt" : "Punkte"}
                  {score >= bestwert && score > 0 ? " - neuer Bestwert!" : ""}
                </p>
                <button
                  type="button"
                  onClick={spielStarten}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-werkzeuge-gradient px-5 py-2.5 text-sm font-medium text-white shadow-card-werkzeuge"
                >
                  <RotateCcw size={14} /> Neues Spiel
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        Fragen zu österreichischem Schulrecht &amp; zum Aufbau des Lehrplans - einfach gehalten,
        keine Rechtsberatung.
      </p>
    </div>
  );
}

function FormVorschau({
  form,
  farbe,
  onClick,
}: {
  form: Formteil;
  farbe: string;
  onClick?: () => void;
}) {
  const { zeilen, spalten } = formGroesse(form);
  const belegt = new Set(form.zellen.map(([r, c]) => `${r}-${c}`));
  const inhalt = (
    <div
      className="grid gap-0.5"
      style={{
        gridTemplateColumns: `repeat(${spalten}, 14px)`,
        gridTemplateRows: `repeat(${zeilen}, 14px)`,
      }}
    >
      {Array.from({ length: zeilen * spalten }).map((_, i) => {
        const r = Math.floor(i / spalten);
        const c = i % spalten;
        const aktiv = belegt.has(`${r}-${c}`);
        return (
          <div key={i} className="rounded-[3px]" style={{ backgroundColor: aktiv ? farbe : "transparent" }} />
        );
      })}
    </div>
  );
  if (!onClick) {
    return (
      <div className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5">
        {inhalt}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
    >
      {inhalt}
    </button>
  );
}
