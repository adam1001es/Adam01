"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  FileDown,
  GraduationCap,
  BookOpenCheck,
  Baby,
  FileSearch,
  CheckCircle2,
  XCircle,
  Gift,
  ArrowRight,
  Users,
  ClipboardList,
  BarChart3,
  LayoutGrid,
  FileCheck2,
  Lock,
  BookOpenText,
  Search,
  Heart,
  Wand2,
  Cpu,
} from "lucide-react";
import {
  TIER_PUNKTE_QUOTA,
  TIER_PREIS_EUR,
  KOSTENLOS_PUNKTE_LIMIT,
  formatEur,
  formatArbeitsblaetterSpanne,
  zuCoins,
} from "@/lib/quota";
import { WorksheetContent, LayoutConfig } from "@/lib/types";
import IslamicPatternStrip from "@/components/IslamicPatternStrip";
import WorksheetView from "@/components/WorksheetView";
import { Tafel, Buecherregal, Fenster, Pflanzenkuebel } from "@/components/Klassenzimmer";

/**
 * Öffentliche Landingpage (siehe app/page.tsx - wird gezeigt, sobald kein eingeloggter Nutzer
 * vorliegt). War über mehrere Erweiterungsrunden des Projekts gewachsen (erst nur
 * Arbeitsblatt-Generator, dann Klassen/Prüfungen, dann Community) und wirkte dadurch wie zwei
 * lose aneinandergehängte Seiten statt einer durchgängigen Erzählung - hier bewusst als EIN
 * zusammenhängender Bogen neu gebaut: Hero -> die vier Bereiche im Überblick -> jeweils vertieft
 * -> Vergleich -> Ablauf -> Preis -> Abschluss-CTA. "use client" wegen der Scroll-Einblend-
 * Animationen (framer-motion, siehe Reveal unten) - rein dekorativ, kein interaktiver Zustand.
 *
 * Praktisch jeder statische Textblock kommt aus "inhalte" (siehe lib/siteContent.ts
 * SITE_CONTENT_FELDER, serverseitig in app/page.tsx per holeSiteInhalte() geladen und admin-
 * editierbar über app/admin/inhalte) statt fest im Code zu stehen - bewusst NICHT jeder String:
 * Absätze mit eingebettetem Preis/Punkte-Wert (z.B. die Preis-Untertitel, die CTA-Fußzeile) bleiben
 * code-seitig fest, damit ein Admin-Override sie nicht versehentlich mit veralteten Zahlen
 * einfriert. Icons, Farben (akzent), Anker-Links und strukturelle Daten (z.B. die
 * Klassenzimmer-Beispielgrafik) bleiben ebenfalls im Code - nur die Textinhalte selbst sind
 * editierbar.
 */

const REVEAL: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-64px" }}
      variants={REVEAL}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({
  eyebrow,
  eyebrowClassName = "text-brand-500",
  title,
  subtitle,
}: {
  eyebrow?: string;
  eyebrowClassName?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className={`text-xs font-semibold uppercase tracking-wide ${eyebrowClassName}`}>{eyebrow}</p>
      )}
      <h2 className="mt-1.5 font-display text-2xl font-semibold text-slate-800 sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm text-slate-500 sm:text-base">{subtitle}</p>}
    </Reveal>
  );
}

// Echte Rendering-Engine statt einer nachgebauten Grafik: dieselbe WorksheetView-Komponente, die
// auch ein tatsächlich erstelltes Arbeitsblatt zeigt (siehe app/worksheet/[id]) - garantiert, dass
// die Vorschau im Hero exakt wie das echte Produkt aussieht, statt eine geschönte Attrappe zu sein.
// Bewusst NICHT admin-editierbar - eine strukturierte Beispiel-Aufgabe, kein einzelner Textblock.
const HERO_VORSCHAU_INHALT: WorksheetContent = {
  titel: "Idschtihad und die Rechtsschulen (Madhahib)",
  fach: "Islamischer Religionsunterricht",
  schulstufe: "7. Klasse AHS-Oberstufe/BMHS (11. Schulstufe)",
  thema: "Idschtihad und die Rechtsschulen (Madhahib)",
  lernziel:
    "Die Schüler:innen können den Begriff Idschtihad erklären und die methodischen Unterschiede der sunnitischen Rechtsschulen einordnen.",
  einleitung:
    "Aus der eigenständigen juristischen Auslegung des Korans und der Sunna durch Gelehrte entwickelten sich ab dem 8. Jahrhundert unterschiedliche Rechtsschulen mit je eigener Methodik.",
  aufgaben: [
    {
      nr: 1,
      typ: "multiple_choice",
      frage: "Was versteht man unter Idschtihad?",
      optionen: [
        "Die eigenständige juristische Auslegungsanstrengung eines Gelehrten zur Herleitung eines Rechtsurteils",
        "Die wortgetreue Übersetzung des Korans in eine andere Sprache",
        "Die konsensuale Übernahme eines bereits bestehenden Rechtsurteils ohne eigene Prüfung",
      ],
      anforderungsbereich: "afb2",
    },
    {
      nr: 2,
      typ: "zuordnung",
      frage: "Ordne jede Rechtsschule ihrem Gründer zu.",
      zuordnungLinks: ["Hanafitische Rechtsschule", "Malikitische Rechtsschule", "Schafiitische Rechtsschule"],
      zuordnungRechts: ["Abu Hanifa", "Malik ibn Anas", "Muhammad ibn Idris asch-Schafii"],
      anforderungsbereich: "afb1",
    },
    {
      nr: 3,
      typ: "offene_frage",
      frage:
        "Erörtere, welche Herausforderungen sich für zeitgenössische Idschtihad-Bemühungen in einer pluralistischen Gesellschaft wie Österreich ergeben.",
      anforderungsbereich: "afb3",
    },
  ],
  loesungen: [
    {
      nr: 1,
      loesung: "Die eigenständige juristische Auslegungsanstrengung eines Gelehrten zur Herleitung eines Rechtsurteils",
    },
    {
      nr: 2,
      loesung: "Hanafitisch - Abu Hanifa, Malikitisch - Malik ibn Anas, Schafiitisch - Muhammad ibn Idris asch-Schafii",
    },
    { nr: 3, loesung: "Individuelle Antwort" },
  ],
  quellen: [{ bezeichnung: "Ibn Ruschd, Bidayat al-Mudschtahid", sicherheit: "gesichert" }],
};

// farbmodus "schwarzweiss" (Standardwert bei echten Generierungen, siehe lib/types.ts) statt
// "farbe": der volltonfarbige "modern"-Kopfbereich (WorksheetView.tsx, isModernFarbig) sieht auf
// dem Bildschirm zwar hübsch aus, aber Lehrkräfte drucken/kopieren Arbeitsblätter für die Klasse
// überwiegend in Schwarzweiß - genau dafür rendert die App bei schwarzweiss stattdessen eine
// schlichte, umrandete Kopfzeile ohne Farbfläche. Für eine Vorschau, die wie ein "echtes",
// tatsächlich ausgedrucktes Arbeitsblatt aussehen soll, ist das die authentischere Wahl.
const HERO_VORSCHAU_LAYOUT: LayoutConfig = {
  template: "modern",
  schriftgroesse: "normal",
  zeigeIslamischesDatum: true,
  zeigeMuster: true,
  musterVariante: "sterne",
  zeigeLernziel: true,
  farbmodus: "schwarzweiss",
};

// Statisches Datum statt new Date() - rein dekorativ, vermeidet aber ein mögliches
// Hydration-Mismatch-Flackern zwischen Server- und Client-Render.
const HERO_VORSCHAU_DATUM = new Date("2026-03-02T09:00:00");

// Icon/Anker-Link/Akzentfarbe bleiben hier fest (strukturell, nicht admin-editierbar) - Titel/Text
// jeder Kachel kommen über den Index aus "inhalte" (landing.pfeiler.<n>.titel/.text).
const PFEILER = [
  { href: "#arbeitsblaetter", icon: Wand2, akzent: "brand" },
  { href: "#klassen", icon: GraduationCap, akzent: "klassen" },
  { href: "#community", icon: Users, akzent: "community" },
  { href: "#koran", icon: BookOpenText, akzent: "gold" },
] as const;

const PFEILER_BADGE: Record<(typeof PFEILER)[number]["akzent"], string> = {
  brand: "bg-brand-50 text-brand-600",
  klassen: "bg-emerald-100 text-emerald-600",
  community: "bg-cyan-100 text-cyan-700",
  gold: "bg-gold-100 text-gold-700",
};

const FEATURES = [
  { icon: ShieldCheck, akzent: "brand" },
  { icon: GraduationCap, akzent: "gold" },
  { icon: BookOpenCheck, akzent: "brand" },
  { icon: Sparkles, akzent: "brand" },
  { icon: FileDown, akzent: "gold" },
  { icon: Baby, akzent: "brand" },
  { icon: FileSearch, akzent: "gold" },
] as const;

const FEATURE_BADGE = {
  brand: "bg-brand-50 text-brand-600",
  gold: "bg-gold-100 text-gold-700",
} as const;

const KLASSEN_ICONS = [Users, ClipboardList, BarChart3, LayoutGrid, FileCheck2, ShieldCheck];
const COMMUNITY_ICONS = [Users, Search, Heart];

/** "tokenGesamt" ist eine aggregierte, anonyme Transparenz-Kennzahl über ALLE Konten hinweg
 * (siehe summeTokens in lib/usageLog.ts, ohne Nutzerbezug, serverseitig in app/page.tsx berechnet
 * und hier nur noch angezeigt) - zeigt Interessent:innen, dass hinter den Arbeitsblättern echte,
 * laufend genutzte KI-Rechenleistung steckt. Optional/undefined abgesichert, falls die Abfrage
 * (noch) keine Daten liefert. "inhalte" kommt aus lib/siteContent.ts (holeSiteInhalte(),
 * serverseitig in app/page.tsx geladen) - siehe Kommentar oben für den Umfang. */
export default function LandingPage({
  tokenGesamt,
  inhalte,
}: {
  tokenGesamt?: number;
  inhalte: Record<string, string>;
}) {
  return (
    <main className="space-y-20 sm:space-y-24">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 pb-14 pt-12 text-white shadow-card sm:px-10 sm:pb-16 sm:pt-16 lg:px-14">
        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold tracking-wide text-white ring-1 ring-inset ring-white/30">
              <Sparkles size={12} /> {inhalte["landing.hero.badge"]}
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.75rem]">
              {inhalte["landing.hero.ueberschrift"]}
            </h1>
            <p className="mt-4 max-w-xl text-sm text-brand-50 sm:text-base">{inhalte["landing.hero.untertext"]}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-surface px-6 py-3 text-sm font-semibold text-brand-700 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0"
              >
                <Gift size={16} /> {formatArbeitsblaetterSpanne(KOSTENLOS_PUNKTE_LIMIT)} kostenlos ausprobieren
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {inhalte["landing.hero.anmeldenButton"]}
              </Link>
            </div>
            <p className="mt-3 text-xs text-brand-50/80">{inhalte["landing.hero.hinweis"]}</p>
          </motion.div>

          {/* Echte WorksheetView-Vorschau, kein nachgebautes Bild - siehe HERO_VORSCHAU_INHALT.
              Echtes DIN-A4-Seitenverhältnis (210:297) statt einer beliebigen Kartenform, plus
              zwei dezente Blätter dahinter, die oben rechts hervorschauen - soll wie ein echter
              kleiner Stapel Arbeitsblätter wirken statt wie eine einzelne UI-Karte. */}
          <motion.div
            className="relative mx-auto aspect-[210/297] w-full max-w-sm lg:max-w-none"
            initial={{ opacity: 0, y: 26, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -2.5 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            <div
              aria-hidden
              className="absolute inset-0 rounded-[3px] bg-[#f6f2e6] shadow-[0_14px_30px_-14px_rgba(15,23,42,0.4)]"
              style={{ transform: "rotate(7deg) translate(14px, -10px)" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-[3px] bg-[#faf6ea] shadow-[0_12px_26px_-12px_rgba(15,23,42,0.35)]"
              style={{ transform: "rotate(3.5deg) translate(7px, -5px)" }}
            />
            <motion.div
              className="absolute inset-0 overflow-hidden rounded-[3px] bg-[#fefdfa] shadow-[0_3px_8px_rgba(15,23,42,0.14),0_30px_55px_-20px_rgba(15,23,42,0.5)] ring-1 ring-black/5"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="origin-top-left scale-[0.56]" style={{ width: "178.6%" }}>
                <WorksheetView
                  content={HERO_VORSCHAU_INHALT}
                  layout={HERO_VORSCHAU_LAYOUT}
                  themenbereich="ibada"
                  erstelltAm={HERO_VORSCHAU_DATUM}
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#fefdfa] to-transparent" />
              {/* Papier-Körnung über der GESAMTEN Seite, auch über der farbigen Kopfzeile - sonst
                  wirkt gerade eine flächige Farbe wie eine digitale UI-Fläche statt bedrucktes
                  Papier. Zwei Ebenen: feine Faser-Körnung (Multiply, deutlich sichtbar) plus eine
                  grobe, sehr blasse "Wolken"-Unruhe darüber (Overlay) für ungleichmäßigen
                  Papierton statt einer computergenerierten Perfektion. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-multiply"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.6' intercept='-0.3'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='c'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23c)'/%3E%3C/svg%3E\")",
                }}
              />
            </motion.div>
            <motion.span
              className="absolute -left-4 -top-4 hidden items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-card ring-1 ring-black/5 sm:inline-flex"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <ShieldCheck size={13} className="text-brand-500" /> {inhalte["landing.hero.badgeGeprueft"]}
            </motion.span>
            <motion.span
              className="absolute -right-4 -bottom-4 hidden items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-gold-700 shadow-card ring-1 ring-black/5 sm:inline-flex"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.9 }}
            >
              <Sparkles size={13} className="text-gold-500" /> {inhalte["landing.hero.badgeSchnell"]}
            </motion.span>
          </motion.div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <IslamicPatternStrip color="#f4ead1" opacity={0.5} hoehe={20} />
        </div>
      </section>

      {/* VIER BEREICHE IM ÜBERBLICK */}
      <section>
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PFEILER.map(({ href, icon: Icon, akzent }, i) => (
            <Reveal key={href} delay={i * 0.07}>
              <a
                href={href}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-surface p-5 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${PFEILER_BADGE[akzent]}`}>
                  <Icon size={17} strokeWidth={2.25} />
                </span>
                <h3 className="mt-3 font-display text-sm font-semibold text-slate-800">
                  {inhalte[`landing.pfeiler.${i + 1}.titel`]}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {inhalte[`landing.pfeiler.${i + 1}.text`]}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 opacity-0 transition group-hover:opacity-100">
                  Mehr erfahren <ArrowRight size={12} />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ARBEITSBLÄTTER VERTIEFT */}
      <section id="arbeitsblaetter" className="scroll-mt-24">
        <SectionHeading
          eyebrow="Arbeitsblätter"
          title={inhalte["landing.arbeitsblaetter.titel"]}
          subtitle={inhalte["landing.arbeitsblaetter.untertitel"]}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, akzent }, i) => (
            <Reveal key={i} delay={(i % 3) * 0.06}>
              <div className="h-full rounded-2xl border border-slate-200 bg-surface p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${FEATURE_BADGE[akzent]}`}>
                  <Icon size={20} strokeWidth={2} />
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-slate-800">
                  {inhalte[`landing.feature.${i + 1}.titel`]}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {inhalte[`landing.feature.${i + 1}.text`]}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* KORAN ALS EIGENSTÄNDIGE QUELLE */}
      <section id="koran" className="scroll-mt-24 relative overflow-hidden rounded-3xl bg-wissen-gradient px-6 py-12 text-white shadow-card-wissen sm:px-10 sm:py-14">
        <div className="relative z-10 mx-auto grid max-w-4xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-inset ring-white/30">
              <BookOpenText size={12} /> {inhalte["landing.koran.badge"]}
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">{inhalte["landing.koran.titel"]}</h2>
            <p className="mt-3 text-sm leading-relaxed text-gold-50 sm:text-base">{inhalte["landing.koran.text"]}</p>
            <ul className="mt-5 space-y-2 text-sm text-gold-50">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-white" />
                  <span>{inhalte[`landing.koran.punkt.${n}`]}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="rounded-2xl bg-white/95 p-5 text-slate-700 shadow-card sm:p-6">
              <p dir="rtl" className="text-right font-display text-xl leading-relaxed text-slate-800 sm:text-2xl">
                وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                „Und verrichtet das Gebet und entrichtet die Abgabe...“
              </p>
              <p className="mt-3 text-xs font-medium text-gold-700">Sure 2 (Al-Baqara), Vers 43</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* KLASSEN & PRÜFUNGEN */}
      <section id="klassen" className="scroll-mt-24 relative overflow-hidden rounded-3xl bg-klassen-gradient px-6 py-12 text-white shadow-card-klassen sm:px-10 sm:py-14">
        <div className="relative z-10 mx-auto max-w-4xl">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-inset ring-white/30">
              <Lock size={12} /> {inhalte["landing.badge.enthaltenImAbo"]}
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">{inhalte["landing.klassen.titel"]}</h2>
            <p className="mt-3 max-w-2xl text-sm text-emerald-50 sm:text-base">{inhalte["landing.klassen.untertitel"]}</p>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KLASSEN_ICONS.map((Icon, i) => (
              <Reveal key={i} delay={(i % 3) * 0.06}>
                <div className="h-full rounded-2xl bg-white/10 p-5 ring-1 ring-inset ring-white/15">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <h3 className="mt-3 font-display text-sm font-semibold">
                    {inhalte[`landing.klassenpunkt.${i + 1}.titel`]}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-50/90">
                    {inhalte[`landing.klassenpunkt.${i + 1}.text`]}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2} className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/80">
              {inhalte["landing.klassenzimmer.label"]}
            </p>
            {/* Dieselben Raum-Bauteile wie in der echten Ansicht (components/Klassenzimmer.tsx) -
                nicht nur die Tische, damit die Landingpage keinen abgespeckten Eindruck vermittelt.
                Die Beispielgrafik selbst (Kürzel/Prozente/Farben) bleibt bewusst strukturiert und
                nicht admin-editierbar - eine Illustration, kein Textblock. */}
            <div className="papier-hell overflow-hidden rounded-2xl shadow-card">
              <div className="bg-gradient-to-b from-[#eaf6f0] to-[#e1f0e8] px-4 pb-6 pt-5 sm:px-8 sm:pt-6">
                <div className="mx-auto flex max-w-md items-end justify-center gap-3 sm:gap-6">
                  <Buecherregal />
                  <Tafel klasseName="7A" klasseSchulstufe="7. Schulstufe" />
                  <Fenster />
                </div>
              </div>
              <div className="relative bg-gradient-to-b from-[#f6efe1] to-[#ece1cb] p-5 sm:p-8">
                <Pflanzenkuebel className="pointer-events-none absolute left-2 top-2 h-10 w-10 opacity-90 sm:left-4 sm:top-4 sm:h-14 sm:w-14" />
                <Pflanzenkuebel className="pointer-events-none absolute right-2 top-2 h-10 w-10 -scale-x-100 opacity-90 sm:right-4 sm:top-4 sm:h-14 sm:w-14" />
                <div className="relative grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {[
                    { kuerzel: "Schüler A.", prozent: 90, farbe: "#1e8c60" },
                    { kuerzel: "Schülerin B.", prozent: 95, farbe: "#1e8c60" },
                    { kuerzel: "Schülerin C.", prozent: 68, farbe: "#c9a04a" },
                    { kuerzel: "Schüler D.", prozent: 48, farbe: "#f97316" },
                    { kuerzel: "Schüler E.", prozent: 28, farbe: "#ef4444" },
                    { kuerzel: "Schülerin F.", prozent: 78, farbe: "#4fb384" },
                  ].map((s, i) => (
                    <motion.div
                      key={s.kuerzel}
                      className="relative"
                      style={{ aspectRatio: "100 / 118" }}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                    >
                      <svg viewBox="0 0 100 118" className="absolute inset-0 h-full w-full drop-shadow-sm" aria-hidden>
                        <rect x="21" y="62" width="58" height="46" rx="18" fill="#bfe0d3" />
                        <rect x="27" y="96" width="46" height="12" rx="6" fill="#a9d6c3" />
                        <rect
                          x="6"
                          y="4"
                          width="88"
                          height="62"
                          rx="14"
                          fill="url(#lernwerk-landing-desk-holz)"
                          stroke="#c9a06a"
                          strokeWidth="1.5"
                        />
                        <rect x="12" y="10" width="28" height="9" rx="4.5" fill="#fff6e4" opacity="0.55" />
                      </svg>
                      <div className="absolute left-1/2 top-[27%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-white"
                          style={{ backgroundColor: s.farbe }}
                        >
                          {s.kuerzel
                            .split(" ")
                            .map((teil) => teil.charAt(0))
                            .join("")}
                        </span>
                        <span className="max-w-[74px] truncate text-[9px] font-medium text-slate-600">{s.kuerzel}</span>
                        <span className="text-[9px] text-slate-500">{s.prozent}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <svg width="0" height="0" className="absolute" aria-hidden>
              <defs>
                <linearGradient id="lernwerk-landing-desk-holz" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f1dfb8" />
                  <stop offset="100%" stopColor="#deba82" />
                </linearGradient>
              </defs>
            </svg>
            <p className="mt-3 text-xs text-emerald-50/80">{inhalte["landing.klassenzimmer.hinweis"]}</p>
          </Reveal>
        </div>
      </section>

      {/* COMMUNITY */}
      <section id="community" className="scroll-mt-24 relative overflow-hidden rounded-3xl bg-community-gradient px-6 py-12 text-white shadow-card sm:px-10 sm:py-14">
        <div className="relative z-10 mx-auto max-w-4xl">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-inset ring-white/30">
              <Users size={12} /> {inhalte["landing.badge.enthaltenImAbo"]}
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">{inhalte["landing.community.titel"]}</h2>
            <p className="mt-3 max-w-2xl text-sm text-cyan-50 sm:text-base">{inhalte["landing.community.untertitel"]}</p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {COMMUNITY_ICONS.map((Icon, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="h-full rounded-2xl bg-white/10 p-5 ring-1 ring-inset ring-white/15">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <h3 className="mt-3 font-display text-sm font-semibold">
                    {inhalte[`landing.communitypunkt.${i + 1}.titel`]}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-cyan-50/90">
                    {inhalte[`landing.communitypunkt.${i + 1}.text`]}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* VERGLEICH */}
      <section>
        <SectionHeading
          title={inhalte["landing.vergleich.titel"]}
          subtitle={inhalte["landing.vergleich.untertitel"]}
        />
        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="mb-4 font-display text-base font-semibold text-slate-500">
                {inhalte["landing.vergleich.spalteChat"]}
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n} className="flex items-start gap-2.5">
                    <XCircle size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <span>{inhalte[`landing.vergleich.chat.${n}`]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border border-brand-300 bg-brand-50 p-6">
              <h3 className="mb-4 font-display text-base font-semibold text-brand-800">
                {inhalte["landing.vergleich.spalteUns"]}
              </h3>
              <ul className="space-y-3 text-sm text-brand-900">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-600" />
                    <span>{inhalte[`landing.vergleich.uns.${n}`]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ABLAUF */}
      <section>
        <SectionHeading title={inhalte["landing.ablauf.titel"]} />
        <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((n, i, arr) => (
            <Reveal key={n} delay={i * 0.1} className="relative flex flex-col items-center text-center">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-semibold shadow-card ${
                  n === 2 ? "bg-gold-400 text-gold-700" : "bg-brand-gradient text-white"
                }`}
              >
                {n}
              </span>
              <h3 className="mt-3 font-display text-base font-semibold text-slate-800">
                {inhalte[`landing.ablauf.${n}.titel`]}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{inhalte[`landing.ablauf.${n}.text`]}</p>
              {i < arr.length - 1 && (
                <ArrowRight size={18} className="absolute -right-2 top-3 hidden text-slate-300 sm:block" />
              )}
            </Reveal>
          ))}
        </div>
      </section>

      {/* PREIS */}
      <section>
        <SectionHeading
          title={inhalte["landing.preis.titel"]}
          subtitle={`Aufgabentypen, Prüfung und Formate sind bei jeder Stufe identisch - der Unterschied ist das Coin-Guthaben (${zuCoins(KOSTENLOS_PUNKTE_LIMIT)} Coins einmalig zum Ausprobieren, ${formatArbeitsblaetterSpanne(KOSTENLOS_PUNKTE_LIMIT)}, vs. ${zuCoins(TIER_PUNKTE_QUOTA.pro)} Coins/Monat im Abo, ${formatArbeitsblaetterSpanne(TIER_PUNKTE_QUOTA.pro)}) sowie der Zugang zur Community und zur Klassenübersicht/Prüfungserstellung, die Abo-Konten vorbehalten sind. Je nach Umfang und Aufgabenanzahl eines Arbeitsblatts wird unterschiedlich viel Guthaben verbraucht, statt einer festen Stückzahl.`}
        />
        <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => (
            <Reveal key={n} delay={(i % 4) * 0.05}>
              <div className="flex h-full items-start gap-2.5 rounded-xl border border-slate-200 bg-surface p-4 text-sm text-slate-600 shadow-card">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-500" />
                <span>{inhalte[`landing.enthalten.${n}`]}</span>
              </div>
            </Reveal>
          ))}
          <Reveal className="sm:col-span-2">
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900 shadow-card-klassen">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>{inhalte["landing.preis.nurImAbo"]}</span>
            </div>
          </Reveal>
        </div>

        <Reveal className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-center">
          <p className="text-sm leading-relaxed text-slate-500">
            <span className="font-medium text-slate-700">{inhalte["landing.preis.wofuerLabel"]} </span>
            {inhalte["landing.preis.wofuerText"]}
          </p>
        </Reveal>

        <Reveal className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-surface p-4 text-center">
            <div className="text-sm font-semibold text-slate-700">Kostenlos</div>
            <div className="mt-1 text-xs text-slate-400">
              {zuCoins(KOSTENLOS_PUNKTE_LIMIT)} Coins insgesamt, einmalig ({formatArbeitsblaetterSpanne(KOSTENLOS_PUNKTE_LIMIT)})
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 text-center">
            <div className="text-sm font-semibold text-slate-700">
              Abo <span className="font-normal text-slate-400">· {formatEur(TIER_PREIS_EUR.pro)}€/Monat</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {zuCoins(TIER_PUNKTE_QUOTA.pro)} Coins/Monat ({formatArbeitsblaetterSpanne(TIER_PUNKTE_QUOTA.pro)}) · inkl.
              Community, Klassen &amp; Prüfungen
            </div>
          </div>
        </Reveal>
        <p className="mt-4 text-center text-xs text-slate-400">{inhalte["landing.preis.freischaltungHinweis"]}</p>
        {tokenGesamt !== undefined && tokenGesamt > 0 && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <Cpu size={13} className="shrink-0" />
            Transparenz: bisher {tokenGesamt.toLocaleString("de-AT")} Einheiten Rechenleistung
            für die Erstellung und Prüfung von Arbeitsblättern eingesetzt.
          </p>
        )}
      </section>

      {/* ABSCHLUSS-CTA */}
      <Reveal>
        <section className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-12 text-center text-white shadow-card sm:px-12 sm:py-14">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{inhalte["landing.cta.ueberschrift"]}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-brand-50 sm:text-base">
            {formatArbeitsblaetterSpanne(KOSTENLOS_PUNKTE_LIMIT)} kostenlos, keine Zahlungsdaten
            nötig - startklar in wenigen Minuten.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-surface px-6 py-3 text-sm font-semibold text-brand-700 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0"
          >
            <Gift size={16} /> {inhalte["landing.cta.registrierenButton"]}
          </Link>
          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <IslamicPatternStrip color="#f4ead1" opacity={0.4} hoehe={16} />
          </div>
        </section>
      </Reveal>
    </main>
  );
}
