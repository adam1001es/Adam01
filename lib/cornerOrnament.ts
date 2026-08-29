/**
 * Islamisches Eckornament: aus einer vom Nutzer bereitgestellten Referenzvorlage extrahiertes
 * L-förmiges Motiv (dichtes Kufi-Geflecht mit mehreren achtzackigen Sternen, verschachtelten
 * Rauten-/Zickzack-Bändern und zarten Arabesken-Ranken an den äußeren Enden). Da das Motiv zu
 * detailreich für eine handgezeichnete Vektor-Nachbildung ist, liegt es als Rasterbild vor
 * (freigestellt, transparenter Hintergrund) statt als SVG-Pfade.
 *
 * Das Quellbild ist für die Ecke "oben-rechts" gezeichnet (Bogen entlang der oberen Kante,
 * Arm entlang der rechten Kante) - alle anderen Ecken werden per CSS/Style-Transform daraus
 * gespiegelt statt als eigene Datei gepflegt.
 */

export type Ecke = "oben-links" | "oben-rechts" | "unten-links" | "unten-rechts";
export type EckFarbe = "schwarz" | "hell";

/** Breite : Höhe der Quellbilder (public/patterns/ecke-*.png). */
export const ECKORNAMENT_SEITENVERHAELTNIS = 603 / 700;

export function eckBildPfadWeb(farbe: EckFarbe): string {
  return farbe === "hell" ? "/patterns/ecke-hell.png" : "/patterns/ecke-schwarz.png";
}

/**
 * Style-Transform, um das (für "oben-rechts" gezeichnete) Motiv auf die gewünschte Ecke zu
 * spiegeln - reines scale() um die eigene Bildmitte reicht, da anders als bei der früheren
 * SVG-Variante keine gemeinsame viewBox-Verschiebung nötig ist.
 */
export function eckenTransform(ecke: Ecke): string {
  const spiegleX = ecke === "oben-links" || ecke === "unten-links";
  const spiegleY = ecke === "unten-links" || ecke === "unten-rechts";
  if (!spiegleX && !spiegleY) return "";
  return `scale(${spiegleX ? -1 : 1}, ${spiegleY ? -1 : 1})`;
}
