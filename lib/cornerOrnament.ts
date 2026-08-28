/**
 * Islamisches Eckornament: ein zweizeiliger Kufi-Winkel mit gestuftem Mäander (wie man ihn von
 * klassischen Buch-/Zertifikatsrändern und Kufi-Bordüren kennt), mit zwei kleinen Quadrat-Akzenten
 * an den Stufen - rein geometrisch (rechtwinklige Linien), keine Schrift, keine religiösen Symbole
 * oder Namen. Wird nur in den Ecken platziert statt als durchgehender Streifen.
 */

export const ECKORNAMENT_VIEWBOX = "0 0 60 60";

/** Äußere Linie: einfacher rechter Winkel (Rahmen). */
export const ECKORNAMENT_AUSSEN = "M 3,57 L 3,3 L 57,3";

/** Innere Linie: gestufter Kufi-Mäander. */
export const ECKORNAMENT_INNEN =
  "M 14,54 L 14,46 L 20,46 L 20,38 L 26,38 L 26,30 L 32,30 L 32,22 L 38,22 L 38,14 L 54,14";

/** Kleine quadratische Akzente ("Knoten") an zwei der Mäander-Stufen. */
export const ECKORNAMENT_QUADRATE: { cx: number; cy: number; groesse: number }[] = [
  { cx: 20, cy: 38, groesse: 4.5 },
  { cx: 32, cy: 22, groesse: 4.5 },
];

export type Ecke = "oben-links" | "oben-rechts" | "unten-links" | "unten-rechts";

/**
 * SVG-Transform, um das (oben-links gezeichnete) Motiv auf die gewünschte Ecke zu spiegeln -
 * spiegelt um die Mitte der 60x60-viewBox (translate+scale kombiniert, unabhängig von
 * transform-origin-Unterstützung, damit es auch in react-pdf funktioniert).
 */
export function eckenTransform(ecke: Ecke): string {
  const spiegleX = ecke === "oben-rechts" || ecke === "unten-rechts";
  const spiegleY = ecke === "unten-links" || ecke === "unten-rechts";
  if (!spiegleX && !spiegleY) return "";
  const tx = spiegleX ? 60 : 0;
  const ty = spiegleY ? 60 : 0;
  return `translate(${tx},${ty}) scale(${spiegleX ? -1 : 1},${spiegleY ? -1 : 1})`;
}
