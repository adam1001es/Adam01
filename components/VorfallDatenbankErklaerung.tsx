"use client";

import { motion, type Variants } from "framer-motion";
import {
  ServerCrash,
  Search,
  Lightbulb,
  KeyRound,
  RefreshCw,
  Hourglass,
  CheckCircle2,
  XCircle,
  Undo2,
  ListChecks,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

interface ZeitstrahlSchritt {
  icon: LucideIcon;
  titel: string;
  text: string;
  fehler?: boolean;
}

const WAS_IST_PASSIERT: ZeitstrahlSchritt[] = [
  {
    icon: ServerCrash,
    titel: "Das Ausgangsproblem",
    text: "Die Seite ist immer wieder unvermittelt abgestürzt und kurz danach von selbst zurückgekommen. Ursache: Die App hat eine DIREKTE Datenbankverbindung genutzt, die nur sehr wenige gleichzeitige Verbindungen erlaubt. Unter Last war dieses Limit schnell erschöpft.",
  },
  {
    icon: Search,
    titel: "Diagnose über Sentry",
    text: "In den Fehlerberichten stand klar \"Too many connections\" (PrismaClientInitializationError). Die Diagnose war richtig: eine gepoolte Verbindung sollte das Limit-Problem lösen.",
  },
  {
    icon: Lightbulb,
    titel: "Der Plan war richtig …",
    text: "Eine gepoolte Verbindung (DATABASE_URL) für den laufenden Betrieb, eine direkte Verbindung (DIRECT_URL) nur für Schema-Änderungen. Das ist grundsätzlich der empfohlene Weg bei dieser Art von Datenbank.",
  },
  {
    icon: XCircle,
    titel: "Fehler 1: Format geraten statt nachgeschaut",
    text: "Ich bin davon ausgegangen, der gepoolte Verbindungsstring müsse mit „prisma+postgres://\" beginnen. Tatsächlich zeigte die Prisma-Konsole einen ganz normalen „postgres://\"-String mit dem Host „pooled.db.prisma.io\". Diese falsche Annahme kam aus dem Gedächtnis, nicht aus der tatsächlich angezeigten Zeile.",
    fehler: true,
  },
  {
    icon: KeyRound,
    titel: "Fehler 2: Falscher Verbindungsstring kopiert",
    text: "Beim ersten Versuch wurde ein gepoolter Wert von einer ANDEREN Datenbank-Sitzung kopiert statt direkt von der richtigen. Ergebnis: Die App verband sich zwar, aber mit einer leeren Datenbank ohne Tabellen.",
    fehler: true,
  },
  {
    icon: RefreshCw,
    titel: "Fehler 3: Live weiterprobiert statt zurückgezogen",
    text: "Statt nach dem ersten Fehlschlag sofort zum letzten bekannten guten Stand zurückzukehren, wurde mehrfach live in der Produktion nachjustiert – jede Korrektur mit einem neuen Redeploy, jede über Handy-Screenshots hin- und hergereicht.",
    fehler: true,
  },
  {
    icon: Hourglass,
    titel: "Fehler 4: Mehrere Redeploys gleichzeitig",
    text: "Mehrere Redeploys kurz hintereinander haben sich gegenseitig blockiert (\"Timed out trying to acquire a postgres advisory lock\") – noch mehr verlorene Zeit für ein Problem, das nichts mehr mit der eigentlichen Ursache zu tun hatte.",
    fehler: true,
  },
  {
    icon: Undo2,
    titel: "Die Lösung, die am Ende funktioniert hat",
    text: "Kompletter Rückbau auf die einfache Variante von vorher: eine einzige DATABASE_URL, keine Zusatz-Erweiterung. Genau der Stand, der wochenlang stabil lief – nur eben ohne den (seltenen) Verbindungslimit-Fix.",
  },
];

const RICHTIGER_WEG: { titel: string; text: string }[] = [
  {
    titel: "Ursache zu 100 % bestätigen, bevor Code geändert wird",
    text: "Die genaue Fehlerklasse in Sentry lesen (nicht nur den Titel) und erst dann eine Lösung planen.",
  },
  {
    titel: "Erst lokal bzw. in einer Vorschau-Umgebung testen",
    text: "Eine Datenbank-Änderung nie zuerst live in der Produktion ausprobieren – erst gegen eine Test-Umgebung prüfen, dass alles wie erwartet läuft.",
  },
  {
    titel: "Verbindungsstrings nie aus dem Gedächtnis tippen",
    text: "Immer exakt den Wert verwenden, den das Tool selbst anzeigt (kopieren, nicht nachbauen) – gerade bei Formaten, die selten gebraucht werden.",
  },
  {
    titel: "Nur eine Änderung auf einmal",
    text: "Eine einzige Variable ändern, EINEN Deploy komplett abwarten und das Ergebnis prüfen – erst dann die nächste Änderung. Niemals mehrere Redeploys parallel anstoßen.",
  },
  {
    titel: "Bei einem Fehlschlag: Fehlermeldung lesen, nicht raten",
    text: "Die echten Build-Logs ansehen (nicht nur \"Error\" in der Übersicht) – dort steht fast immer die genaue Ursache.",
  },
  {
    titel: "Eine klare Zeitgrenze setzen",
    text: "Läuft eine Lösung nach ca. 15–20 Minuten nicht: sofort zurück zum letzten bekannt guten Stand (Revert), statt weiter live zu experimentieren.",
  },
  {
    titel: "Infrastruktur-Änderungen nicht unter Zeitdruck",
    text: "Größere Änderungen an Datenbank/Umgebungsvariablen möglichst dann angehen, wenn Zeit und Ruhe da sind – ein Rückzug ist immer möglich, muss aber auch genutzt werden.",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 24 } },
};

export default function VorfallDatenbankErklaerung() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30"
      >
        <ShieldAlert size={28} strokeWidth={2} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-800 dark:text-slate-100">
            Datenbank-Vorfall vom 3.–4. September 2026
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Diese Seite ist nur für dich sichtbar. Sie erklärt in Ruhe, was heute schiefgelaufen ist und
            wie wir es beim nächsten Anlauf besser machen – ohne die gleichen Fehler zu wiederholen.
          </p>
        </div>
      </motion.div>

      <section className="mb-14">
        <h2 className="mb-6 font-display text-lg font-semibold text-slate-800 dark:text-slate-100">
          Was ist eigentlich passiert?
        </h2>
        <motion.ol
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="relative space-y-6 border-l-2 border-slate-200 pl-8 dark:border-slate-700"
        >
          {WAS_IST_PASSIERT.map((schritt, i) => {
            const Icon = schritt.icon;
            return (
              <motion.li key={schritt.titel} variants={itemVariants} className="relative">
                <span
                  className={`absolute -left-[2.55rem] flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    schritt.fehler
                      ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
                      : "border-teal-300 bg-teal-50 text-teal-600 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-400"
                  }`}
                >
                  <Icon size={16} strokeWidth={2.25} />
                </span>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Schritt {i + 1}
                </p>
                <h3 className="mt-0.5 font-display text-base font-semibold text-slate-800 dark:text-slate-100">
                  {schritt.titel}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {schritt.text}
                </p>
              </motion.li>
            );
          })}
        </motion.ol>
      </section>

      <section className="mb-10">
        <div className="mb-6 flex items-center gap-2">
          <ListChecks size={20} strokeWidth={2.25} className="text-teal-600 dark:text-teal-400" />
          <h2 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-100">
            Der richtige Weg beim nächsten Mal
          </h2>
        </div>
        <motion.ol
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-3"
        >
          {RICHTIGER_WEG.map((punkt, i) => (
            <motion.li
              key={punkt.titel}
              variants={itemVariants}
              className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/60"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {punkt.titel}
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {punkt.text}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </section>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.4 }}
        className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-900/60 dark:bg-teal-950/30"
      >
        <CheckCircle2 size={24} strokeWidth={2} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          <strong>In einem Satz:</strong> Die Idee (gepoolte Verbindung) war richtig – der Fehler war, sie
          live und unter Zeitdruck auszuprobieren, statt sie vorher sicher zu verifizieren und bei
          Problemen sofort zum letzten guten Stand zurückzukehren.
        </p>
      </motion.div>
    </div>
  );
}
