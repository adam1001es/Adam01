/**
 * Islamisches Musterelement: ein einfacher, zentrierter Zierstreifen statt eines flächigen
 * Ornaments - aus derselben vom Nutzer bereitgestellten Referenzvorlage geschnitten (nur der
 * obere, horizontale Streifen mit Arabeske, zwei achtzackigen Sternen und geometrischem
 * Zickzack-/Rautenband), aber bewusst klein und in normalem Textfluss statt großflächig über
 * den Ecken platziert - damit er nie mit Titel/Text kollidiert oder unverhältnismäßig viel
 * Platz einnimmt.
 */

export type MusterFarbe = "schwarz" | "hell";

/** Breite : Höhe der Streifenbilder (public/patterns/leiste-*.png). */
export const MUSTERSTREIFEN_SEITENVERHAELTNIS = 900 / 336;

export function musterstreifenPfadWeb(farbe: MusterFarbe): string {
  return farbe === "hell" ? "/patterns/leiste-hell.png" : "/patterns/leiste-schwarz.png";
}
