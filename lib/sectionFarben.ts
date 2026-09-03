/** Eine Akzentfarbe pro großem Formular-Abschnitt (siehe SectionCard + NewWorksheetForm) - bewusst
 * zentral an einer Stelle definiert, damit Kartenrahmen/Badge UND alle auswählbaren Chips/Buttons
 * innerhalb eines Abschnitts (z.B. "Aufgaben" = Gold) konsequent dieselbe Farbe verwenden, statt
 * überall grün (die generische Button-Farbe der App). Nur die "aktiv"-Zustände und dezente
 * Hervorhebungsboxen bekommen Farbe - alles andere bleibt neutral, damit es nicht kitschig wird. */
export const SEKTION_FARBEN = {
  blau: {
    badge: "bg-sky-100 text-sky-700",
    kante: "border-l-sky-400",
    boxBorder: "border-sky-200",
    boxBg: "bg-gradient-to-br from-sky-50 to-white",
    boxLabel: "text-sky-700",
    aktiv: "border-sky-600 bg-sky-50 text-sky-700",
    // Sehr dezenter "Glas"-Farbton für die Kartenfläche selbst (siehe SectionCard) - verankert an
    // der farbigen linken Kante und läuft nach rechts in Transparenz aus, statt die ganze Fläche
    // gleichmäßig einzufärben. Niedrige Deckkraft (~9,5%, ca. 20% mehr als die ursprünglichen 8%)
    // bewusst gewählt, damit es bei mehreren Karten pro Seite (Inhalt/Aufgaben/Layout) als feine
    // Unterscheidung wirkt, nicht als Farbfläche.
    wash: "from-sky-400/[0.095]",
  },
  gold: {
    badge: "bg-gold-100 text-gold-700",
    kante: "border-l-gold-400",
    boxBorder: "border-gold-200",
    boxBg: "bg-gradient-to-br from-gold-50 to-white",
    boxLabel: "text-gold-700",
    aktiv: "border-gold-600 bg-gold-50 text-gold-700",
    wash: "from-gold-400/[0.095]",
  },
  brand: {
    badge: "bg-brand-100 text-brand-700",
    kante: "border-l-brand-400",
    boxBorder: "border-brand-300",
    boxBg: "bg-gradient-to-br from-brand-50 to-white",
    boxLabel: "text-brand-600",
    aktiv: "border-brand-600 bg-brand-50 text-brand-700",
    wash: "from-brand-400/[0.095]",
  },
} as const;

export type SektionAkzent = keyof typeof SEKTION_FARBEN;
