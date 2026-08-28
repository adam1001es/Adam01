/**
 * Ganz dezentes islamisches Eckornament: ein schlichter, zweizeiliger Kufi-Winkel (wie man ihn
 * von klassischen Buch-/Zertifikatsrändern kennt) - rein geometrisch (rechtwinklige Linien),
 * keine Schrift, keine religiösen Symbole oder Namen. Wird nur in den Ecken platziert statt als
 * durchgehender Streifen.
 */

export const ECKORNAMENT_VIEWBOX = "0 0 60 60";

/** Äußere Linie: einfacher rechter Winkel. */
export const ECKORNAMENT_AUSSEN = "M 2,56 L 2,4 L 56,4";

/** Innere Linie: paralleler Winkel mit einer kleinen Stufe (Kufi-Motiv). */
export const ECKORNAMENT_INNEN = "M 10,56 L 10,22 L 18,22 L 18,12 L 56,12";

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
