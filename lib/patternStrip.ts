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

/**
 * Hauptformen - achtzackiger Stern, Vieleck-/Rauten-Reihen, stroke-width 1.15.
 * Der Stern samt umgebendem Innenkern/Rauten war ursprünglich um x=44 zentriert, obwohl die
 * Kachel (Breite 80) ihre Mitte bei x=40 hat und die seitlichen Rauten dort auch korrekt
 * zentriert sind - der Stern berührte die linke Raute exakt, überlappte die rechte aber um
 * 8 statt symmetrisch je 4 Einheiten. Um 4 Einheiten nach links verschoben, damit der Stern-
 * Cluster wirklich in der Kachel zentriert ("in sich mittig") ist.
 */
export const MUSTERSTREIFEN_HAUPT_STRICHSTAERKE = 1.15;
export const MUSTERSTREIFEN_HAUPT_PFADE: string[] = [
  // Achtzackiger Hauptstern (auf Kachelmitte x=40 zentriert)
  "M12,28 L17.5,18.5 L27,16.5 L32,8 L40,13 L48,8 L53,16.5 L62.5,18.5 L68,28 L62.5,37.5 L53,39.5 L48,48 L40,43 L32,48 L27,39.5 L17.5,37.5 Z",
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
  "M40,4 L46,10 L40,15 L34,10 Z",
  "M40,41 L46,46 L40,52 L34,46 Z",
  // Ineinandergreifende Vielecke
  "M18,10 L26,5 L34,10 L30,17 L22,17 Z",
  "M46,10 L54,5 L62,10 L58,17 L50,17 Z",
  "M18,46 L26,51 L34,46 L30,39 L22,39 Z",
  "M46,46 L54,51 L62,46 L58,39 L50,39 Z",
];

/** Innerer Sternkern + kleine Verbindungsrauten, stroke-width 1.0 (ebenfalls auf x=40 rezentriert). */
export const MUSTERSTREIFEN_INNEN_STRICHSTAERKE = 1.0;
export const MUSTERSTREIFEN_INNEN_PFADE: string[] = [
  "M32,22 L40,16 L48,22 L40,28 Z",
  "M32,34 L40,28 L48,34 L40,40 Z",
  "M22,28 L29,22 L36,28 L29,34 Z",
  "M44,28 L51,22 L58,28 L51,34 Z",
];

/** Feine Gitterlinien, stroke-width 0.95. */
export const MUSTERSTREIFEN_FEIN_STRICHSTAERKE = 0.95;
export const MUSTERSTREIFEN_FEIN_PFADE: string[] = [
  "M10,16 L16,22",
  "M64,16 L70,22",
  "M10,40 L16,34",
  "M64,40 L70,34",
];
