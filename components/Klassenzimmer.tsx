"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { prozentZuNote, NOTE_LABEL, NOTE_FARBE, NOTE_FARBE_LEER, type Note } from "@/lib/noten";
import type { VerlaufsEintrag } from "@/lib/klassen";

export interface SchuelerFuerAnsicht {
  id: string;
  label: string;
  anzahlErgebnisse: number;
  durchschnittProzent: number | null;
  verlauf: VerlaufsEintrag[];
}

function initialen(label: string): string {
  const buchstabe = label.trim().charAt(0).toUpperCase() || "?";
  const zahl = label.match(/\d+/)?.[0] ?? "";
  return `${buchstabe}${zahl}`;
}

function farbeFuerProzent(prozent: number | null): string {
  return prozent === null ? NOTE_FARBE_LEER : NOTE_FARBE[prozentZuNote(prozent)];
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const deskVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

function ProzentRing({ prozent, farbe, size = 128 }: { prozent: number | null; farbe: string; size?: number }) {
  const radius = size / 2 - 9;
  const umfang = 2 * Math.PI * radius;
  const offset = prozent === null ? umfang : umfang - (Math.max(0, Math.min(100, prozent)) / 100) * umfang;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={9} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={farbe}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={umfang}
          initial={{ strokeDashoffset: umfang }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold text-slate-800">
          {prozent === null ? "–" : `${Math.round(prozent)}%`}
        </span>
      </div>
    </div>
  );
}

/** Kreidetafel im Holzrahmen mit Kreideablage - ersetzt die frühere schlichte dunkle Balken-Leiste
 * über den Schülertischen. Bewusst als HTML/CSS statt eigenem SVG-Text umgesetzt, damit der
 * Klassenname in der App-eigenen Schrift (font-display) sauber gerendert wird statt als starre
 * SVG-<text>-Form. */
export function Tafel({ klasseName, klasseSchulstufe }: { klasseName: string; klasseSchulstufe: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-md shrink-0 rounded-2xl p-2 shadow-lg sm:p-2.5"
      style={{ background: "linear-gradient(160deg, #9a7850, #6f5433)" }}
    >
      <div
        className="rounded-xl px-5 py-6 shadow-inner sm:px-7 sm:py-8"
        style={{ background: "linear-gradient(155deg, #43866a, #2f6a52)" }}
      >
        <p
          className="truncate text-center font-display text-sm text-[#f4efe2]/90 sm:text-lg"
          style={{ textShadow: "0 1px 1px rgba(0,0,0,0.2)" }}
        >
          {klasseName}
          {klasseSchulstufe ? ` · ${klasseSchulstufe}` : ""}
        </p>
      </div>
      <div className="mx-auto mt-2 flex h-3 w-4/5 items-center justify-center gap-1.5 rounded-full bg-[#6f5433]">
        <span className="h-1.5 w-3.5 rounded-full bg-[#f4efe2]" />
        <span className="h-1.5 w-3.5 rounded-full bg-[#f6d9a0]" />
        <span className="h-1.5 w-3.5 rounded-full bg-[#eec2c2]" />
      </div>
    </motion.div>
  );
}

const BUECHER_FARBEN = ["#f3c6c0", "#bfe1ee", "#f4e2a1", "#c8e0c3", "#d9c9ea", "#f6d9a0"];

/** Dezentes Bücherregal als Wand-Deko - nur ab sm: sichtbar, damit auf schmalen Handy-Breiten der
 * Platz komplett den Schülertischen gehört. */
export function Buecherregal({ className = "" }: { className?: string }) {
  return (
    <div
      className={`hidden w-20 shrink-0 self-end rounded-t-lg border-2 border-b-0 border-[#9a7850] bg-[#c9a679]/25 p-1.5 sm:block lg:w-24 ${className}`}
    >
      {[0, 1].map((reihe) => (
        <div
          key={reihe}
          className="mb-1.5 flex h-9 items-end gap-0.5 border-b-2 border-[#9a7850]/60 pb-0.5 last:mb-0 lg:h-11"
        >
          {BUECHER_FARBEN.slice(reihe === 0 ? 0 : 2, reihe === 0 ? 4 : 6).map((farbe, i) => (
            <span
              key={i}
              className="w-1.5 rounded-t-[2px] lg:w-2"
              style={{ height: `${55 + ((i + reihe) % 3) * 18}%`, backgroundColor: farbe }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Fenster mit Blick auf ein bisschen Grün - reine Wand-Deko, ab sm: sichtbar (siehe Buecherregal). */
export function Fenster({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative hidden h-20 w-20 shrink-0 self-end rounded-lg border-[3px] border-[#faf7f0] bg-gradient-to-b from-[#cfe8f7] to-[#e4f2fa] shadow-inner sm:block lg:h-24 lg:w-24 ${className}`}
    >
      <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-[#faf7f0]" />
      <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[#faf7f0]" />
      <span className="absolute -bottom-2 left-1/2 h-4 w-5 -translate-x-1/2 rounded-t-full bg-[#8fbf8a]" />
    </div>
  );
}

/** Pflanzenkübel in den Bodenecken - reine Deko, hält die Fläche neben den Tischen nicht komplett
 * leer, ohne selbst Aufmerksamkeit von den eigentlichen Schülertischen zu ziehen. */
export function Pflanzenkuebel({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M20 62 L16 40 H48 L44 62 Z" fill="#d99a78" />
      <rect x="14" y="34" width="36" height="8" rx="3" fill="#c98763" />
      <path d="M32 40 C20 30 18 12 30 4 C34 16 30 26 32 40 Z" fill="#7fae74" />
      <path d="M32 40 C44 32 46 14 34 6 C30 18 34 28 32 40 Z" fill="#6fa066" />
      <path d="M32 40 C24 26 34 20 28 8 C36 14 38 28 32 40 Z" fill="#8fbf8a" />
    </svg>
  );
}

/** Ein Tisch+Stuhl-Platz von oben (Top-Down), mit Namensschild-Sticker (Avatar/Name/Prozent) auf
 * der Tischfläche - ersetzt die frühere flache Verlaufsbox. Bleibt bewusst ein <motion.button> mit
 * denselben Varianten/Handlern wie zuvor, nur die visuelle Hülle ist neu. */
function DeskButton({ schueler, onClick }: { schueler: SchuelerFuerAnsicht; onClick: () => void }) {
  const farbe = farbeFuerProzent(schueler.durchschnittProzent);
  const gradientId = `lernwerk-desk-holz-${schueler.id}`;

  return (
    <motion.button
      type="button"
      variants={deskVariants}
      whileHover={{ scale: 1.045, y: -3 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="group relative block w-full"
      style={{ aspectRatio: "100 / 118" }}
    >
      <svg viewBox="0 0 100 118" className="absolute inset-0 h-full w-full drop-shadow-md" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f1dfb8" />
            <stop offset="100%" stopColor="#deba82" />
          </linearGradient>
        </defs>
        {/* Stuhl (hinter dem Tisch, Richtung Klassenraum-Mitte) */}
        <rect
          x="21"
          y="62"
          width="58"
          height="46"
          rx="18"
          fill="#bfe0d3"
          className="transition group-hover:fill-[#a9d6c3]"
        />
        <rect x="27" y="96" width="46" height="12" rx="6" fill="#a9d6c3" />
        <circle cx="28" cy="106" r="3.5" fill="#a9d6c3" />
        <circle cx="72" cy="106" r="3.5" fill="#a9d6c3" />
        {/* Tischplatte */}
        <rect x="6" y="4" width="88" height="62" rx="14" fill={`url(#${gradientId})`} stroke="#c9a06a" strokeWidth="1.5" />
        <rect x="12" y="10" width="28" height="9" rx="4.5" fill="#fff6e4" opacity="0.55" />
        {/* Deko: aufgeschlagenes Heft + Stift in der Ecke, Mitte bleibt frei für das Namensschild */}
        <g transform="translate(64 40) rotate(-8)">
          <rect x="0" y="0" width="20" height="14" rx="1.5" fill="#e7d3f5" />
          <rect x="1.6" y="1.6" width="16.8" height="10.8" rx="1" fill="#f4ecfb" />
          <line x1="10" y1="2.5" x2="10" y2="11.5" stroke="#d9c0ee" strokeWidth="0.8" />
        </g>
        <line x1="12" y1="52" x2="26" y2="58" stroke="#8b6b43" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="52" r="1.6" fill="#e07a5f" />
      </svg>

      <span className="absolute left-1/2 top-[27%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow-inner ring-2 ring-white transition group-hover:ring-4 sm:h-11 sm:w-11"
          style={{ backgroundColor: farbe }}
        >
          {initialen(schueler.label)}
        </span>
        <span className="max-w-[84px] truncate text-[11px] font-medium text-slate-700 sm:max-w-[100px] sm:text-xs">
          {schueler.label}
        </span>
        <span className="text-[10px] text-slate-500">
          {schueler.durchschnittProzent === null ? "Noch kein Ergebnis" : `${Math.round(schueler.durchschnittProzent)}%`}
        </span>
      </span>
    </motion.button>
  );
}

function DetailPanel({ schueler, onClose }: { schueler: SchuelerFuerAnsicht; onClose: () => void }) {
  const note: Note | null = schueler.durchschnittProzent === null ? null : prozentZuNote(schueler.durchschnittProzent);
  const farbe = farbeFuerProzent(schueler.durchschnittProzent);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-card-klassen sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-l-3xl sm:rounded-t-none"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 260 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Schüler:in</p>
            <h2 className="font-display text-2xl font-semibold text-slate-800">{schueler.label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <ProzentRing prozent={schueler.durchschnittProzent} farbe={farbe} />
          <p className="mt-3 text-center text-sm text-slate-500">
            {note === null
              ? "Noch keine Ergebnisse erfasst"
              : `Ø Note ${note} · ${NOTE_LABEL[note]} (Richtwert)`}
          </p>
        </div>

        <h3 className="mb-3 mt-8 text-sm font-semibold text-slate-700">
          Bisherige Ergebnisse ({schueler.verlauf.length})
        </h3>
        {schueler.verlauf.length === 0 ? (
          <p className="text-sm text-slate-400">Noch keine Zuweisung mit Ergebnis erfasst.</p>
        ) : (
          <div className="space-y-4">
            {schueler.verlauf.map((v, i) => (
              <div key={v.zuweisungId}>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="truncate font-medium text-slate-700">{v.titel}</span>
                  <span className="shrink-0">{new Date(v.datum).toLocaleDateString("de-AT")}</span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: farbeFuerProzent(v.prozent) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${v.prozent ?? 0}%` }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{v.istPruefung ? "Prüfung" : "Arbeitsblatt"}</span>
                  <span>{v.prozent === null ? "– (noch nicht benotet)" : `${Math.round(v.prozent)}%`}</span>
                </div>
                {v.notiz && <p className="mt-1 text-xs italic text-slate-500">„{v.notiz}“</p>}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}

/** Top-down Klassenzimmer-Illustration als verspielter Alternativ-Zugang zur Wissensstand-Tabelle
 * auf app/klassen/[id]: Wandbereich mit Tafel/Bücherregal/Fenster, Bodenbereich mit Pflanzenkübeln
 * und Tisch+Stuhl-Plätzen statt reiner Tabellen-Zeilen. Klick auf einen Platz animiert ein
 * Detail-Panel mit Prozent-Ring und Ergebnisverlauf ein. Rein visuelle Ansicht - Daten/Berechnung
 * kommen unverändert aus lib/klassen.ts, keine eigene Aggregationslogik. */
export default function Klassenzimmer({
  klasseId,
  klasseName,
  klasseSchulstufe,
  schueler,
}: {
  klasseId: string;
  klasseName: string;
  klasseSchulstufe: string | null;
  schueler: SchuelerFuerAnsicht[];
}) {
  const [ausgewaehltId, setAusgewaehltId] = useState<string | null>(null);
  const ausgewaehlt = schueler.find((s) => s.id === ausgewaehltId) ?? null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/klassen/${klasseId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowLeft size={15} /> Zurück zu {klasseName}
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
            Klassenzimmer
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-full border border-slate-200 bg-surface px-3.5 py-2 text-[11px] text-slate-500 shadow-sm">
          {([1, 2, 3, 4, 5] as Note[]).map((note) => (
            <span key={note} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NOTE_FARBE[note] }} />
              {NOTE_LABEL[note]}
            </span>
          ))}
        </div>
      </div>

      {schueler.length === 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-surface p-8 text-center shadow-card-klassen">
          <p className="text-sm text-slate-500">
            Noch keine Schüler:innen in dieser Klasse -{" "}
            <Link href={`/klassen/${klasseId}`} className="font-medium text-emerald-600 hover:underline">
              zuerst auf der Klassenseite hinzufügen
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="papier-hell overflow-hidden rounded-3xl border border-[#cfe4da] shadow-card-klassen">
          {/* Wandbereich: pastellgrüne Wand mit Tafel mittig, Bücherregal/Fenster als Rahmen */}
          <div className="bg-gradient-to-b from-[#eaf6f0] to-[#e1f0e8] px-4 pb-8 pt-6 sm:px-8 sm:pt-8">
            <div className="mx-auto flex max-w-3xl items-end justify-center gap-3 sm:gap-6 lg:gap-10">
              <Buecherregal />
              <Tafel klasseName={klasseName} klasseSchulstufe={klasseSchulstufe} />
              <Fenster />
            </div>
          </div>

          {/* Bodenbereich: Holzboden mit Pflanzenkübeln in den Ecken und den Tisch+Stuhl-Plätzen */}
          <div className="relative bg-gradient-to-b from-[#f6efe1] to-[#ece1cb] p-5 sm:p-10">
            <Pflanzenkuebel className="pointer-events-none absolute left-2 top-2 h-12 w-12 opacity-90 sm:left-5 sm:top-5 sm:h-16 sm:w-16" />
            <Pflanzenkuebel
              className="pointer-events-none absolute right-2 top-2 h-12 w-12 -scale-x-100 opacity-90 sm:right-5 sm:top-5 sm:h-16 sm:w-16"
            />

            <motion.div
              className="relative mt-6 grid grid-cols-2 gap-4 sm:mt-2 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {schueler.map((s) => (
                <DeskButton key={s.id} schueler={s} onClick={() => setAusgewaehltId(s.id)} />
              ))}
            </motion.div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {ausgewaehlt && <DetailPanel schueler={ausgewaehlt} onClose={() => setAusgewaehltId(null)} />}
      </AnimatePresence>
    </>
  );
}
