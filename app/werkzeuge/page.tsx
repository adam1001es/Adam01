import { redirect } from "next/navigation";
import Link from "next/link";
import { Wrench, CalendarDays, BookMarked, Layers, Mail, LayoutGrid } from "lucide-react";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Übersicht der "Werkzeuge" - praktische Alltagshelfer für Lehrkräfte, die bewusst KEIN
 * KI-Kontingent verbrauchen (reine Datumsrechnung oder Lesezugriff auf bereits admin-geprüfte
 * Wissensbasis-Daten) und deshalb für ALLE eingeloggten Konten frei nutzbar sind, unabhängig vom
 * Abo-Status - anders als Community/Forum (dort kostet das ÖFFNEN fremder Inhalte ein Abo) oder
 * Klassen (Prüfungsgenerierung zählt gegen das Punkte-Kontingent). Bewusst als eigener Bereich
 * statt in "Neues Arbeitsblatt" integriert, damit die Erstellen-Seite nicht mit fachfremden
 * Zusatzfunktionen überladen wird. */
const WERKZEUGE = [
  {
    href: "/werkzeuge/kalender",
    icon: CalendarDays,
    titel: "Islamischer Schuljahres-Kalender",
    beschreibung:
      "Ramadan, Eid al-Fitr, Eid al-Adha, Aschura, Mawlid und mehr - die nächsten Termine auf einen Blick, zur Unterrichtsplanung.",
  },
  {
    href: "/werkzeuge/zitate",
    icon: BookMarked,
    titel: "Koran- & Hadith-Bibliothek",
    beschreibung:
      "Alle bereits admin-geprüften Zitate durchsuchen und nach Grundkompetenz filtern - zum Nachschlagen, nicht nur zur Arbeitsblatt-Erstellung.",
  },
  {
    href: "/werkzeuge/vokabeln",
    icon: Layers,
    titel: "Arabisch-Vokabeltrainer",
    beschreibung:
      "Islamische Fachbegriffe aus der geprüften Wissensbasis als Karteikarten üben - für dich selbst oder zum Vorlesen in der Klasse.",
  },
  {
    href: "/werkzeuge/elternbriefe",
    icon: Mail,
    titel: "Elternbrief-Vorlagen",
    beschreibung:
      "Fertige Word-Vorlagen für Ramadan-Info, Exkursions-Einverständnis und Schuljahresbeginn - mit Platzhaltern zum selbst Ausfüllen.",
  },
  {
    href: "/werkzeuge/sitzplan",
    icon: LayoutGrid,
    titel: "Sitzplan-Generator",
    beschreibung:
      "Zufälliger Sitzplan für eine deiner Klassen - Spaltenzahl anpassen, neu mischen, drucken.",
  },
] as const;

export default async function WerkzeugePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main>
      <div className="relative overflow-hidden rounded-2xl bg-werkzeuge-gradient px-6 py-8 shadow-card-werkzeuge sm:px-9 sm:py-10">
        <div className="max-w-2xl">
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-semibold text-white sm:text-4xl">
            <Wrench size={28} strokeWidth={2} /> Werkzeuge
          </h1>
          <p className="mt-2 text-sm text-amber-50/90 sm:text-base">
            Praktische Alltagshelfer für Lehrkräfte - komplett kostenlos und ohne KI-Kontingent,
            unabhängig vom Abo-Status.
          </p>
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WERKZEUGE.map(({ href, icon: Icon, titel, beschreibung }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-card-werkzeuge-hover"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Icon size={20} strokeWidth={2} />
              </span>
              <div className="mt-3 font-display text-lg font-semibold text-slate-800 group-hover:text-amber-700">
                {titel}
              </div>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">{beschreibung}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
