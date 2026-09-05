"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { CheckCircle2, HelpCircle, RotateCcw, Trophy, XCircle } from "lucide-react";
import { SPIEL_FRAGEN, type SpielFrage } from "@/lib/spielFragen";
import {
  type Formteil,
  FARBPALETTE,
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

const RASTER_SPALTEN = 8;
const RASTER_ZEILEN = 10;
const ZEILEN_PRO_LEVEL = 5;
const HIGHSCORE_KEY = "lernwerk_bloecke_highscore";
// Bei Touch schwebt der Schatten über dem Finger (sonst verdeckt der Finger genau die Zelle, die
// man treffen will) - bei Maus/Stift bleibt der Schatten direkt am Zeiger.
const TOUCH_ANHEBUNG = 70;

type Phase = "start" | "frage" | "waehlen" | "platzieren" | "ende";
type Raster = (string | null)[][];
interface FormMitFarbe {
  form: Formteil;
  farbe: string;
}
interface DragZustand {
  pointerId: number;
  x: number;
  y: number;
  anhebung: number;
  zellGroesse: number;
  stueck: FormMitFarbe;
}

function leeresRaster(): Raster {
  return Array.from({ length: RASTER_ZEILEN }, () => Array<string | null>(RASTER_SPALTEN).fill(null));
}

function passtAn(raster: Raster, form: Formteil, ankerR: number, ankerC: number): boolean {
  return form.zellen.every(([dr, dc]) => {
    const r = ankerR + dr;
    const c = ankerC + dc;
    return r >= 0 && r < RASTER_ZEILEN && c >= 0 && c < RASTER_SPALTEN && raster[r][c] === null;
  });
}

function findeGueltigenAnker(raster: Raster, form: Formteil): boolean {
  for (let r = 0; r < RASTER_ZEILEN; r++) {
    for (let c = 0; c < RASTER_SPALTEN; c++) {
      if (passtAn(raster, form, r, c)) return true;
    }
  }
  return false;
}

// "Shuffle-Bag": mischt den GESAMTEN Fragenkatalog einmal durch und zieht danach nacheinander
// ohne Zurücklegen - so wiederholt sich KEINE Frage, bevor nicht wirklich jede andere einmal
// dran war (statt wie zuvor bei rein zufälliger Ziehung schon nach wenigen Runden Wiederholungen
// zu riskieren, selbst bei einem größeren Fragenkatalog). Erst wenn der Beutel leer ist, wird neu
// gemischt.
function mischeFragenBeutel(letzteId: string | null): SpielFrage[] {
  const beutel = [...SPIEL_FRAGEN];
  for (let i = beutel.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [beutel[i], beutel[j]] = [beutel[j], beutel[i]];
  }
  // Verhindert, dass ausgerechnet die zuletzt gezeigte Frage (letzte des vorigen Beutels) als
  // Erstes im neuen Beutel direkt wieder drankommt.
  if (letzteId && beutel[0]?.id === letzteId && beutel.length > 1) {
    [beutel[0], beutel[1]] = [beutel[1], beutel[0]];
  }
  return beutel;
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
  const [drag, setDrag] = useState<DragZustand | null>(null);
  const [blitzZellen, setBlitzZellen] = useState<Set<string> | null>(null);
  const [feierAktiv, setFeierAktiv] = useState(false);
  const [antwortFeedback, setAntwortFeedback] = useState<"richtig" | "falsch" | null>(null);
  const [regelnOffen, setRegelnOffen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const schuettelControls = useAnimation();
  const fragenBeutelRef = useRef<SpielFrage[]>([]);

  const feierPartikel = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        winkel: (i / 10) * Math.PI * 2,
        farbe: FARBPALETTE[i % FARBPALETTE.length],
      })),
    [],
  );

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
    if (fragenBeutelRef.current.length === 0) {
      fragenBeutelRef.current = mischeFragenBeutel(letzte);
    }
    const f = fragenBeutelRef.current.shift()!;
    setLetzteFrageId(f.id);
    setFrage(f);
    setPhase("frage");
  }, []);

  const spielBeenden = useCallback(() => {
    setPhase("ende");
    schuettelControls.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.5 },
    });
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
  }, [score, schuettelControls]);

  const stueckSetzenUndPruefen = useCallback(
    (kandidat: FormMitFarbe, aktuellerRaster: Raster) => {
      setAktuellesStueck(kandidat);
      if (!findeGueltigenAnker(aktuellerRaster, kandidat.form)) {
        spielBeenden();
        return;
      }
      setPhase("platzieren");
    },
    [spielBeenden],
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
      // Kurzer Farb-Flash (grün/rot) direkt auf der Fragekarte, BEVOR es weitergeht, damit
      // erkennbar ist, ob die Antwort richtig oder falsch war - sonst sah man bei "falsch" gar
      // keine Rückmeldung, sondern bekam kommentarlos ein schwereres Kästchen zugewiesen.
      setAntwortFeedback(richtig ? "richtig" : "falsch");
      setTimeout(() => {
        setAntwortFeedback(null);
        if (richtig) {
          const optionen = dreiAuswahlFormen().map((form) => ({ form, farbe: zufallsFarbe() }));
          if (!optionen.some((option) => findeGueltigenAnker(raster, option.form))) {
            spielBeenden();
            return;
          }
          setAuswahlOptionen(optionen);
          setPhase("waehlen");
        } else {
          stueckSetzenUndPruefen({ form: zufallsSchwereForm(), farbe: zufallsFarbe() }, raster);
        }
      }, 700);
    },
    [frage, raster, stueckSetzenUndPruefen, spielBeenden],
  );

  const platziereStueck = useCallback(
    (stueck: FormMitFarbe, r: number, c: number) => {
      if (!passtAn(raster, stueck.form, r, c)) {
        setUngueltigeZelle(`${r}-${c}`);
        setTimeout(() => setUngueltigeZelle(null), 300);
        return;
      }

      const neu = raster.map((row) => row.slice());
      for (const [dr, dc] of stueck.form.zellen) {
        neu[r + dr][c + dc] = stueck.farbe;
      }

      const vollZeilen = [...Array(RASTER_ZEILEN).keys()].filter((rr) => neu[rr].every((z) => z !== null));
      const vollSpalten = [...Array(RASTER_SPALTEN).keys()].filter((cc) => neu.every((row) => row[cc] !== null));
      const geloescht = vollZeilen.length + vollSpalten.length;

      const neuerScore = score + stueck.form.zellen.length + geloescht * 10;
      const neuesZeilenTotal = zeilenGeloescht + geloescht;
      const vorherigesLevel = Math.floor(zeilenGeloescht / ZEILEN_PRO_LEVEL);
      const neuesLevel = Math.floor(neuesZeilenTotal / ZEILEN_PRO_LEVEL);

      // Zuerst das voll gefüllte Raster zeigen (die neu gesetzten Zellen "poppen" automatisch per
      // Key-Wechsel im Rendering, siehe motion.button unten), dann kurz aufblitzen lassen, erst
      // danach die volle(n) Zeile/Spalte wirklich leeren - das "juice" typischer
      // Block-Puzzle-Spiele statt eines sofortigen, unbemerkten Verschwindens.
      setRaster(neu);
      setAktuellesStueck(null);
      setHoverAnker(null);
      setScore(neuerScore);
      setZeilenGeloescht(neuesZeilenTotal);

      if (geloescht > 0) {
        const zuLoeschen = new Set<string>();
        vollZeilen.forEach((rr) => {
          for (let cc = 0; cc < RASTER_SPALTEN; cc++) zuLoeschen.add(`${rr}-${cc}`);
        });
        vollSpalten.forEach((cc) => {
          for (let rr = 0; rr < RASTER_ZEILEN; rr++) zuLoeschen.add(`${rr}-${cc}`);
        });
        setBlitzZellen(zuLoeschen);
        setFeierAktiv(true);
        setTimeout(() => setFeierAktiv(false), 700);
        setTimeout(() => {
          setRaster((aktuell) => {
            const geleert = aktuell.map((row) => row.slice());
            vollZeilen.forEach((rr) => geleert[rr].fill(null));
            vollSpalten.forEach((cc) => geleert.forEach((row) => (row[cc] = null)));
            return geleert;
          });
          setBlitzZellen(null);
        }, 260);
      }

      if (neuesLevel > vorherigesLevel) {
        setLevelToast(true);
        setTimeout(() => setLevelToast(false), 1800);
      }

      naechsteFrage(letzteFrageId);
    },
    [raster, score, zeilenGeloescht, letzteFrageId, naechsteFrage],
  );

  const zellKlick = useCallback(
    (r: number, c: number) => {
      if (phase !== "platzieren" || !aktuellesStueck) return;
      platziereStueck(aktuellesStueck, r, c);
    },
    [phase, aktuellesStueck, platziereStueck],
  );

  // Der schwebende Schatten wird optisch AUF dem Zeiger zentriert (siehe Ghost-Rendering unten,
  // -translate-x-1/2 -translate-y-1/2) - der Anker (die linke obere Ecke der Form) muss deshalb
  // aus der ZEIGERPOSITION MINUS der halben Formgröße berechnet werden, sonst stimmt die
  // Auflöse-Position nicht mit dem sichtbaren Schatten überein (genau das wirkte "ungenau").
  const berechneAnker = useCallback(
    (clientX: number, clientY: number, form: Formteil): { r: number; c: number } | null => {
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return null;
      const zellGroesse = rect.width / RASTER_SPALTEN;
      const { zeilen, spalten } = formGroesse(form);
      const c = Math.round((clientX - rect.left) / zellGroesse - spalten / 2);
      const r = Math.round((clientY - rect.top) / zellGroesse - zeilen / 2);
      if (r < 0 || r >= RASTER_ZEILEN || c < 0 || c >= RASTER_SPALTEN) return null;
      return { r, c };
    },
    [],
  );

  const aktiverAnker = useMemo(() => {
    if (drag) return berechneAnker(drag.x, drag.y - drag.anhebung, drag.stueck.form);
    return hoverAnker;
  }, [drag, hoverAnker, berechneAnker]);

  // Nimmt das Stück jetzt explizit entgegen (statt implizit `aktuellesStueck` zu lesen), damit
  // auch die drei Auswahl-Karten in der "waehlen"-Phase direkt ziehbar sein können - dort gibt es
  // (bewusst) noch kein `aktuellesStueck`, weil das Auswählen und Platzieren zu einer einzigen
  // Ziehgeste verschmolzen sind.
  //
  // releaseVerarbeitetRef verhindert doppelte Verarbeitung EINES Loslassens: pointerup/-cancel
  // wird sowohl vom ziehenden Element (via Zeigererfassung) als auch von einem globalen
  // Fenster-Listener weiter unten behandelt (Sicherheitsnetz für Touch-Geräte, bei denen manche
  // Browser das Ereignis nach einer unterbrochenen Erfassung nicht mehr ans ursprüngliche Element
  // liefern - sonst bliebe der Ziehschatten für immer sichtbar hängen). Ein Ref statt State, weil
  // die Prüfung SYNCHRON greifen muss, bevor React einen erneuten Render committet.
  const releaseVerarbeitetRef = useRef(false);

  const dragStarten = useCallback((e: React.PointerEvent<HTMLElement>, stueck: FormMitFarbe) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    releaseVerarbeitetRef.current = false;
    setHoverAnker(null);
    const rect = gridRef.current?.getBoundingClientRect();
    const zellGroesse = rect && rect.width > 0 ? rect.width / RASTER_SPALTEN : 40;
    setDrag({
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      anhebung: e.pointerType === "touch" ? TOUCH_ANHEBUNG : 0,
      zellGroesse,
      stueck,
    });
  }, []);

  const dragBewegen = useCallback((e: React.PointerEvent<HTMLElement>) => {
    setDrag((d) => (d && d.pointerId === e.pointerId ? { ...d, x: e.clientX, y: e.clientY } : d));
  }, []);

  const dragBeenden = useCallback(
    (e: React.PointerEvent<HTMLElement> | PointerEvent) => {
      if (!drag || drag.pointerId !== e.pointerId || releaseVerarbeitetRef.current) return;
      releaseVerarbeitetRef.current = true;
      const ziel = berechneAnker(e.clientX, e.clientY - drag.anhebung, drag.stueck.form);
      const stueck = drag.stueck;
      setDrag(null);
      setHoverAnker(null);
      if (ziel) platziereStueck(stueck, ziel.r, ziel.c);
    },
    [drag, berechneAnker, platziereStueck],
  );

  const dragAbbrechen = useCallback(() => {
    releaseVerarbeitetRef.current = true;
    setDrag(null);
    setHoverAnker(null);
  }, []);

  // Fenster-weites Sicherheitsnetz: solange gezogen wird, zusätzlich auf pointerup/-cancel am
  // window lauschen. Manche mobilen Browser liefern das Loslassen nach einer durch Systemgesten
  // unterbrochenen Zeigererfassung nicht mehr an das ursprüngliche Element - ohne dieses
  // Sicherheitsnetz bliebe der schwebende Schatten dann dauerhaft sichtbar hängen.
  useEffect(() => {
    if (!drag) return;
    const aufLoslassen = (e: PointerEvent) => dragBeenden(e);
    const aufAbbruch = (e: PointerEvent) => {
      if (e.pointerId === drag.pointerId) dragAbbrechen();
    };
    window.addEventListener("pointerup", aufLoslassen);
    window.addEventListener("pointercancel", aufAbbruch);
    return () => {
      window.removeEventListener("pointerup", aufLoslassen);
      window.removeEventListener("pointercancel", aufAbbruch);
    };
  }, [drag, dragBeenden, dragAbbrechen]);

  const vorschau = useMemo(() => {
    const stueck = drag ? drag.stueck : phase === "platzieren" ? aktuellesStueck : null;
    if (!stueck || !aktiverAnker) return null;
    const gueltig = passtAn(raster, stueck.form, aktiverAnker.r, aktiverAnker.c);
    const zellen = new Set(
      stueck.form.zellen.map(([dr, dc]) => `${aktiverAnker.r + dr}-${aktiverAnker.c + dc}`),
    );
    return { zellen, gueltig, farbe: stueck.farbe };
  }, [phase, aktuellesStueck, aktiverAnker, raster, drag]);

  return (
    <div className="rounded-2xl border border-amber-200 bg-surface p-4 shadow-card-werkzeuge sm:p-5">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">
          Punkte:{" "}
          <motion.span
            key={score}
            initial={{ scale: 1.5, color: "#10b981" }}
            animate={{ scale: 1, color: "#475569" }}
            transition={{ duration: 0.4 }}
            className="inline-block font-semibold"
          >
            {score}
          </motion.span>
        </span>
        <span className="text-slate-500">Level {level}</span>
        <span className="flex items-center gap-1 text-amber-700">
          <Trophy size={14} /> Bestwert: {bestwert}
        </span>
        <button
          type="button"
          onClick={() => setRegelnOffen(true)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-300 text-amber-700 transition hover:bg-amber-50"
          aria-label="Spielregeln anzeigen"
        >
          <HelpCircle size={15} />
        </button>
      </div>

      {phase === "start" ? (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-6 text-center sm:p-8">
          <p className="font-display text-lg font-semibold text-slate-800">Wissensblöcke</p>
          <p className="mx-auto mt-2 max-w-[34ch] text-sm text-slate-600">
            Kein Zeitdruck: du entscheidest in Ruhe, wie du Fragen beantwortest und Kästchen
            platzierst.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-700">
            So funktioniert&apos;s
          </p>
          <div className="mt-2">
            <SpielRegelnListe />
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
            type="button"
            onClick={spielStarten}
            className="mt-4 rounded-lg bg-werkzeuge-gradient px-5 py-2.5 text-sm font-medium text-white shadow-card-werkzeuge"
          >
            Spiel starten
          </motion.button>
        </div>
      ) : (
        <>
          <div className="relative mx-auto" style={{ maxWidth: 400 }}>
            {levelToast && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.7 }}
                className="absolute inset-x-0 -top-3 z-20 mx-auto w-fit rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white shadow-card"
              >
                ✨ Level {level} erreicht! ✨
              </motion.div>
            )}

            <motion.div animate={schuettelControls}>
              <div
                ref={gridRef}
                className="grid gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2"
                style={{ gridTemplateColumns: `repeat(${RASTER_SPALTEN}, 1fr)` }}
                onMouseLeave={() => !drag && setHoverAnker(null)}
              >
                {raster.map((row, r) =>
                  row.map((zelle, c) => {
                    const key = `${r}-${c}`;
                    const invalid = ungueltigeZelle === key;
                    const blitz = blitzZellen?.has(key) ?? false;
                    const previewHit = vorschau?.zellen.has(key) ?? false;
                    let hintergrund = "#e2e8f0";
                    if (zelle) hintergrund = zelle;
                    else if (previewHit) hintergrund = vorschau?.gueltig ? `${vorschau.farbe}cc` : "#f87171";
                    return (
                      <motion.button
                        key={`${key}-${zelle ?? "leer"}`}
                        initial={zelle ? { scale: 0.25, opacity: 0.3 } : false}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.55, duration: 0.3 }}
                        type="button"
                        disabled={phase !== "platzieren"}
                        onClick={() => zellKlick(r, c)}
                        onMouseEnter={() => phase === "platzieren" && !drag && setHoverAnker({ r, c })}
                        whileTap={phase === "platzieren" ? { scale: 0.88 } : undefined}
                        className={`aspect-square rounded-md transition-colors duration-100 ${
                          invalid ? "animate-pulse" : ""
                        } ${blitz ? "ring-2 ring-white" : ""}`}
                        style={{ backgroundColor: invalid ? "#fca5a5" : blitz ? "#ffffff" : hintergrund }}
                      />
                    );
                  }),
                )}
              </div>
            </motion.div>

            <AnimatePresence>
              {feierAktiv && (
                <motion.div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-visible">
                  {feierPartikel.map((p) => (
                    <motion.span
                      key={p.id}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                      animate={{
                        x: Math.cos(p.winkel) * 100,
                        y: Math.sin(p.winkel) * 100,
                        opacity: 0,
                        scale: 1.3,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute h-3 w-3 rounded-full"
                      style={{ backgroundColor: p.farbe }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {phase === "frage" && frage && (
                <motion.div
                  key="frage"
                  initial={{ opacity: 0, scale: 0.7, rotate: -4 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7, rotate: 4 }}
                  transition={{ type: "spring", bounce: 0.4, duration: 0.45 }}
                  className="absolute inset-x-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center justify-center gap-4 rounded-xl p-4 text-center shadow-2xl transition-colors duration-300"
                  style={{
                    backgroundColor:
                      antwortFeedback === "richtig"
                        ? "rgba(5,150,105,0.94)"
                        : antwortFeedback === "falsch"
                          ? "rgba(190,18,60,0.94)"
                          : "rgba(255,255,255,0.8)",
                  }}
                >
                  {antwortFeedback ? (
                    <motion.div
                      key={antwortFeedback}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", bounce: 0.5, duration: 0.4 }}
                      className="flex flex-col items-center gap-2 text-white"
                    >
                      {antwortFeedback === "richtig" ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
                      <p className="text-lg font-bold">{antwortFeedback === "richtig" ? "Richtig!" : "Falsch!"}</p>
                    </motion.div>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-slate-800">{frage.text}</p>
                      <div className="flex gap-4">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          whileHover={{ scale: 1.06 }}
                          type="button"
                          onClick={() => antworten(true)}
                          className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md"
                        >
                          Wahr
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          whileHover={{ scale: 1.06 }}
                          type="button"
                          onClick={() => antworten(false)}
                          className="rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md"
                        >
                          Falsch
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {phase === "waehlen" && (
                <motion.div
                  key="waehlen"
                  initial={{ opacity: 0, scale: 0.7, rotate: 4 }}
                  animate={{ opacity: drag ? 0 : 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7, rotate: -4 }}
                  transition={{
                    default: { type: "spring", bounce: 0.4, duration: 0.45 },
                    opacity: drag ? { duration: 0.15 } : { type: "spring", bounce: 0.4, duration: 0.45 },
                  }}
                  className={`absolute inset-x-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center justify-center gap-3 rounded-xl bg-white/80 p-4 text-center shadow-2xl ${
                    drag ? "pointer-events-none" : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-emerald-700">Richtig! Ziehe dein Kästchen ins Raster:</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {auswahlOptionen.map((option, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.08, rotate: 3 }}
                        style={{ opacity: drag?.stueck === option ? 0.3 : 1 }}
                        className="inline-flex cursor-grab touch-none items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm active:cursor-grabbing"
                        onPointerDown={(e) => dragStarten(e, option)}
                        onPointerMove={dragBewegen}
                        onPointerUp={dragBeenden}
                        onPointerCancel={dragAbbrechen}
                      >
                        <FormGitter form={option.form} farbe={option.farbe} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {phase === "ende" && (
                <motion.div
                  key="ende"
                  initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: "spring", bounce: 0.45, duration: 0.5 }}
                  className="absolute inset-x-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center justify-center gap-3 rounded-xl bg-white/85 p-5 text-center shadow-2xl"
                >
                  <p className="font-display text-lg font-semibold text-slate-800">Kein Platz mehr!</p>
                  <p className="text-sm text-slate-500">
                    {score} {score === 1 ? "Punkt" : "Punkte"}
                    {score >= bestwert && score > 0 ? " - neuer Bestwert!" : ""}
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    type="button"
                    onClick={spielStarten}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-werkzeuge-gradient px-5 py-2.5 text-sm font-medium text-white shadow-card-werkzeuge"
                  >
                    <RotateCcw size={14} /> Neues Spiel
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {drag && (
            <div
              className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg"
              style={{ left: drag.x, top: drag.y - drag.anhebung }}
            >
              <FormGitter
                form={drag.stueck.form}
                farbe={drag.stueck.farbe}
                zellPixel={drag.zellGroesse}
                gapClass="gap-1"
              />
            </div>
          )}

          <AnimatePresence>
            {phase === "platzieren" && aktuellesStueck && (
              <motion.div
                key="platzieren-hinweis"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="mt-4 text-center"
              >
                <p className="mb-2 text-sm text-slate-500">Ziehe dein Kästchen ins Raster:</p>
                <div
                  className="inline-flex cursor-grab touch-none items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm active:cursor-grabbing"
                  style={{ opacity: drag ? 0.3 : 1 }}
                  onPointerDown={(e) => dragStarten(e, aktuellesStueck)}
                  onPointerMove={dragBewegen}
                  onPointerUp={dragBeenden}
                  onPointerCancel={dragAbbrechen}
                >
                  <FormGitter form={aktuellesStueck.form} farbe={aktuellesStueck.farbe} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        Fragen zu Schulrecht, Pädagogik, islamischem Grundwissen &amp; Schulalltag - einfach
        gehalten, keine Rechtsberatung.
      </p>

      <AnimatePresence>
        {regelnOffen && (
          <motion.div
            key="regeln-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
            onClick={() => setRegelnOffen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", bounce: 0.35, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-2xl"
            >
              <p className="font-display text-base font-semibold text-slate-800">So funktioniert&apos;s</p>
              <div className="mt-3">
                <SpielRegelnListe />
              </div>
              <button
                type="button"
                onClick={() => setRegelnOffen(false)}
                className="mt-4 rounded-lg bg-werkzeuge-gradient px-5 py-2 text-sm font-medium text-white shadow-card-werkzeuge"
              >
                Verstanden
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SpielRegelnListe() {
  return (
    <ol className="mx-auto max-w-[34ch] list-decimal space-y-2 pl-5 text-left text-sm text-slate-600">
      <li>Beantworte die Wahr-oder-Falsch-Frage.</li>
      <li>
        <strong className="text-emerald-700">Richtig?</strong> Wähle eines von drei Kästchen und
        ziehe es direkt ins Raster.
      </li>
      <li>
        <strong className="text-rose-700">Falsch?</strong> Du bekommst automatisch ein größeres,
        unregelmäßiges Kästchen zugewiesen.
      </li>
      <li>Fülle eine ganze Reihe oder Spalte komplett - sie löst sich auf und bringt Bonuspunkte.</li>
      <li>Game Over, sobald dein Kästchen nirgendwo mehr ins Raster passt.</li>
    </ol>
  );
}

function FormGitter({
  form,
  farbe,
  zellPixel = 14,
  gapClass = "gap-0.5",
}: {
  form: Formteil;
  farbe: string;
  zellPixel?: number;
  gapClass?: string;
}) {
  const { zeilen, spalten } = formGroesse(form);
  const belegt = new Set(form.zellen.map(([r, c]) => `${r}-${c}`));
  return (
    <div
      className={`grid ${gapClass}`}
      style={{
        gridTemplateColumns: `repeat(${spalten}, ${zellPixel}px)`,
        gridTemplateRows: `repeat(${zeilen}, ${zellPixel}px)`,
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
}
