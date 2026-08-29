/**
 * Islamisches Musterelement: ein horizontal durchlaufender, echter Kachel-Zierstreifen (Girih-
 * Stil) - ein achtzackiger Stern abwechselnd mit einer länglichen Sechseck-Form, eingefasst von
 * einer doppelten Rahmenlinie oben/unten. Anders als der vorherige "ein Motiv, das an den Enden
 * spitz zuläuft"-Entwurf ist das hier ein waagrecht beliebig oft wiederholbares Kachelmuster
 * (wie klassische Rand-/Bordürenmuster in maurischer/Alhambra-Fliesenkunst) - eine Kachel wird
 * so oft nebeneinandergesetzt, wie in die verfügbare Breite passt, ohne Verzerrung.
 */

/** Breite/Höhe einer einzelnen Kachel (Koordinatensystem, in dem die Pfade unten definiert sind). */
export const MUSTERSTREIFEN_KACHEL_BREITE = 100;
export const MUSTERSTREIFEN_KACHEL_HOEHE = 40;

/** Achtzackiger Stern, mittig in der Kachel (bei x=50). */
export const MUSTERSTREIFEN_STERN_PFAD =
  "M 50,4 L 52.68,13.53 L 61.31,8.69 L 56.47,17.32 L 66,20 L 56.47,22.68 L 61.31,31.31 L 52.68,26.47 L 50,36 L 47.32,26.47 L 38.69,31.31 L 43.53,22.68 L 34,20 L 43.53,17.32 L 38.69,8.69 L 47.32,13.53 Z";

/** Längliche Sechseck-Verbindungsform, mittig auf der Kachelnaht (bei x=0) - verbindet beim
 *  Aneinanderreihen die Sterne benachbarter Kacheln. */
export const MUSTERSTREIFEN_HEXAGON_PFAD = "M 33,20 L 16,9 L -16,9 L -33,20 L -16,31 L 16,31 Z";

/** Y-Koordinaten der doppelten Rahmenlinie oben/unten (im Kachel-Koordinatensystem). */
export const MUSTERSTREIFEN_RAHMEN_Y = [3, 6, 34, 37] as const;
