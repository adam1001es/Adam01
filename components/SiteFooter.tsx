"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const INFO_LINKS = [
  { href: "/paedagogik", label: "Pädagogischer Ansatz" },
  { href: "/schulstufen", label: "Schulstufen" },
  { href: "/ueber-uns", label: "Über Lernwerk" },
  { href: "/faq", label: "Häufige Fragen" },
];

const RECHT_LINKS = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
];

/** Bewusst sehr unauffällig (mattes, sehr helles Grau, sanft eingeblendet statt fest sichtbar) -
 * trotzdem ist jede Seite mit einem Klick erreichbar (u.a. §5 ECG: "leicht und unmittelbar
 * erreichbar" fürs Impressum). */
export default function SiteFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-4 pb-6 pt-2 text-center text-xs text-slate-300 dark:text-slate-700"
    >
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {INFO_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="transition hover:text-slate-400 dark:hover:text-slate-500">
            {label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {RECHT_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="transition hover:text-slate-400 dark:hover:text-slate-500">
            {label}
          </Link>
        ))}
      </div>
    </motion.footer>
  );
}
