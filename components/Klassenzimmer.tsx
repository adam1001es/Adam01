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

function DeskButton({ schueler, onClick }: { schueler: SchuelerFuerAnsicht; onClick: () => void }) {
  const farbe = farbeFuerProzent(schueler.durchschnittProzent);
  return (
    <motion.button
      type="button"
      variants={deskVariants}
      whileHover={{ scale: 1.045, y: -3 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="group relative flex flex-col items-center gap-2 rounded-2xl border border-[#d9c7a3] bg-gradient-to-b from-[#ecdbb9] to-[#d9c093] p-4 pb-5 shadow-sm transition hover:shadow-card-klassen-hover"
    >
      <span className="absolute -bottom-1.5 h-2 w-10 rounded-full bg-[#a9895c]/40" aria-hidden />
      <span
        className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white shadow-inner ring-2 ring-white transition group-hover:ring-4"
        style={{ backgroundColor: farbe }}
      >
        {initialen(schueler.label)}
      </span>
      <span className="max-w-full truncate text-xs font-medium text-slate-700">{schueler.label}</span>
      <span className="text-[11px] text-slate-500">
        {schueler.durchschnittProzent === null ? "Noch kein Ergebnis" : `${Math.round(schueler.durchschnittProzent)}%`}
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
 * auf app/klassen/[id]: Tafel + Schülertische statt Zeilen, Klick auf einen Tisch animiert ein
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
        <div className="papier-hell rounded-3xl border border-slate-200 bg-gradient-to-b from-[#f6efe1] to-[#ece1cb] p-6 shadow-card-klassen sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto flex h-16 w-full max-w-md items-center justify-center rounded-xl bg-slate-800 px-4 shadow-inner sm:h-20"
          >
            <span className="truncate font-display text-sm text-white/85 sm:text-base">
              {klasseName}
              {klasseSchulstufe ? ` · ${klasseSchulstufe}` : ""}
            </span>
          </motion.div>
          <div className="mx-auto mt-3 h-4 w-28 rounded bg-gold-500/30" aria-hidden />

          <motion.div
            className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {schueler.map((s) => (
              <DeskButton key={s.id} schueler={s} onClick={() => setAusgewaehltId(s.id)} />
            ))}
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {ausgewaehlt && <DetailPanel schueler={ausgewaehlt} onClose={() => setAusgewaehltId(null)} />}
      </AnimatePresence>
    </>
  );
}
