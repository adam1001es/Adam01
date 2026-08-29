/**
 * Islamisches Eckornament: ein L-förmiger Rahmen mit dünnen, präzisen Linien - bewusst
 * minimalistisch und luftig statt dicht gepackt. Enthält die klassische islamische Formensprache
 * in reduzierter Form: ein achtzackiger Stern nahe der Ecke (Motiv), ein kleinerer zweiter Stern
 * im vertikalen Arm, Rauten mit Zickzack-Verbindungslinien, ein kufisch-eckiger Winkelakzent und
 * zarte Arabesken-Blattspitzen an den äußeren Enden. Rein geometrisch/linienbasiert (keine
 * Schrift, kein Gottesname, kein Koran-Vers), nur in den Ecken platziert statt als Streifen.
 */

export const ECKORNAMENT_VIEWBOX = "0 0 100 100";

/** Alle Pfade des Motivs (oben-links gezeichnet) - jeweils dünne Kontur, keine Füllung. */
export const ECKORNAMENT_PFADE: string[] = [
  // Äußerer Rahmen (rechter Winkel)
  "M 4,96 L 4,4 L 96,4",
  // Fokus-Stern nahe der Ecke
  "M 28.00,14.00 L 30.57,21.79 L 37.90,18.10 L 34.21,25.43 L 42.00,28.00 L 34.21,30.57 L 37.90,37.90 L 30.57,34.21 L 28.00,42.00 L 25.43,34.21 L 18.10,37.90 L 21.79,30.57 L 14.00,28.00 L 21.79,25.43 L 18.10,18.10 L 25.43,21.79 Z",
  // Kleinerer zweiter Stern im vertikalen Arm
  "M 15.68,53.53 L 15.47,57.53 L 19.47,57.32 L 16.50,60.00 L 19.47,62.68 L 15.47,62.47 L 15.68,66.47 L 13.00,63.50 L 10.32,66.47 L 10.53,62.47 L 6.53,62.68 L 9.50,60.00 L 6.53,57.32 L 10.53,57.53 L 10.32,53.53 L 13.00,56.50 Z",
  // Zickzack-Verbindung + Raute im horizontalen Arm
  "M 45,17 L 51,10 L 58,15",
  "M 66,5 L 72,11 L 66,17 L 60,11 Z",
  // Kufisch-eckiger Winkelakzent, horizontaler Arm
  "M 78,4 L 78,9 L 84,9",
  // Arabesken-Blattspitze, äußeres Ende horizontaler Arm
  "M 90,4 Q 94.03,7.82 99.00,5.35 Q 94.97,1.52 90,4 Z",
  "M 90,4 Q 93.66,3.88 94.80,0.40 Q 91.14,0.52 90,4 Z",
  // Kufisch-eckiger Winkelakzent, vertikaler Arm
  "M 4,78 L 9,78 L 9,84",
  // Arabesken-Blattspitze, äußeres Ende vertikaler Arm
  "M 4,90 Q 1.52,94.97 5.35,99.00 Q 7.82,94.03 4,90 Z",
  "M 4,90 Q 0.52,91.14 0.40,94.80 Q 3.88,93.66 4,90 Z",
];

export type Ecke = "oben-links" | "oben-rechts" | "unten-links" | "unten-rechts";

/**
 * SVG-Transform, um das (oben-links gezeichnete) Motiv auf die gewünschte Ecke zu spiegeln -
 * spiegelt um die Mitte der 100x100-viewBox (translate+scale kombiniert, unabhängig von
 * transform-origin-Unterstützung, damit es auch in react-pdf funktioniert).
 */
export function eckenTransform(ecke: Ecke): string {
  const spiegleX = ecke === "oben-rechts" || ecke === "unten-rechts";
  const spiegleY = ecke === "unten-links" || ecke === "unten-rechts";
  if (!spiegleX && !spiegleY) return "";
  const tx = spiegleX ? 100 : 0;
  const ty = spiegleY ? 100 : 0;
  return `translate(${tx},${ty}) scale(${spiegleX ? -1 : 1},${spiegleY ? -1 : 1})`;
}
