/**
 * Islamisches Musterelement: ein horizontal durchlaufender, echter Kachel-Zierstreifen (Girih-
 * Stil) - ein achtzackiger Stern mit innerem Kern, umgeben von kleineren Rauten- und
 * Vieleck-Formen, die an den Kachel-Rändern exakt ineinander übergehen, eingefasst von einer
 * Rahmenlinie oben/unten. Ein waagrecht beliebig oft wiederholbares Kachelmuster (wie klassische
 * Rand-/Bordürenmuster in maurischer/Alhambra-Fliesenkunst) - eine Kachel wird so oft
 * nebeneinandergesetzt, wie in die verfügbare Breite passt, ohne Verzerrung.
 */

/** Breite/Höhe einer einzelnen Kachel (Koordinatensystem, in dem die Pfade unten definiert sind). */
export const MUSTERSTREIFEN_KACHEL_BREITE = 80;
export const MUSTERSTREIFEN_KACHEL_HOEHE = 56;

/** Rahmenlinie oben/unten (Y-Koordinaten im Kachel-Koordinatensystem), stroke-width 1.6. */
export const MUSTERSTREIFEN_RAHMEN_Y = [1, 55] as const;
export const MUSTERSTREIFEN_RAHMEN_STRICHSTAERKE = 1.6;

/** Hauptformen - achtzackiger Stern, Vieleck-/Rauten-Reihen, stroke-width 1.15. */
export const MUSTERSTREIFEN_HAUPT_STRICHSTAERKE = 1.15;
export const MUSTERSTREIFEN_HAUPT_PFADE: string[] = [
  // Achtzackiger Hauptstern
  "M16,28 L21.5,18.5 L31,16.5 L36,8 L44,13 L52,8 L57,16.5 L66.5,18.5 L72,28 L66.5,37.5 L57,39.5 L52,48 L44,43 L36,48 L31,39.5 L21.5,37.5 Z",
  // Obere Vieleck-Reihe (Kachelränder links/rechts)
  "M0,10 L6,5 L14,8 L12,16 L4,16 Z",
  "M66,10 L74,5 L80,10 L76,16 L68,16 Z",
  // Untere Vieleck-Reihe
  "M0,46 L6,51 L14,48 L12,40 L4,40 Z",
  "M66,46 L74,51 L80,46 L76,40 L68,40 Z",
  // Seitliche Rauten, verbinden zur Nachbarkachel
  "M0,28 L8,20 L16,28 L8,36 Z",
  "M64,28 L72,20 L80,28 L72,36 Z",
  // Obere/untere vertikale Rauten
  "M44,4 L50,10 L44,15 L38,10 Z",
  "M44,41 L50,46 L44,52 L38,46 Z",
  // Ineinandergreifende Vielecke
  "M22,10 L30,5 L38,10 L34,17 L26,17 Z",
  "M50,10 L58,5 L66,10 L62,17 L54,17 Z",
  "M22,46 L30,51 L38,46 L34,39 L26,39 Z",
  "M50,46 L58,51 L66,46 L62,39 L54,39 Z",
];

/** Innerer Sternkern + kleine Verbindungsrauten, stroke-width 1.0. */
export const MUSTERSTREIFEN_INNEN_STRICHSTAERKE = 1.0;
export const MUSTERSTREIFEN_INNEN_PFADE: string[] = [
  "M36,22 L44,16 L52,22 L44,28 Z",
  "M36,34 L44,28 L52,34 L44,40 Z",
  "M26,28 L33,22 L40,28 L33,34 Z",
  "M48,28 L55,22 L62,28 L55,34 Z",
];

/** Feine Gitterlinien, stroke-width 0.95. */
export const MUSTERSTREIFEN_FEIN_STRICHSTAERKE = 0.95;
export const MUSTERSTREIFEN_FEIN_PFADE: string[] = [
  "M10,16 L16,22",
  "M64,16 L70,22",
  "M10,40 L16,34",
  "M64,40 L70,34",
];
