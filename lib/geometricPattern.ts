/**
 * Ganz dezentes islamisches Zierelement: ein dünner, beidseitig ausgeblendeter Goldsteg mit
 * wenigen kleinen Rauten in der Mitte - bewusst kein Stern- oder Rankenmotiv, sondern eine
 * minimalistische, moderne Interpretation klassischer geometrischer Zierstreifen. Rein
 * geometrisch (Linie + Polygone), keine Schrift, keine religiösen Symbole oder Namen.
 */

export interface Zierstreifen {
  linie: { x1: number; y1: number; x2: number; y2: number };
  rauten: string[]; // SVG-Pfad ("d") je Raute
}

function rautePfad(cx: number, cy: number, radius: number): string {
  return `M ${cx.toFixed(2)},${(cy - radius).toFixed(2)} L ${(cx + radius).toFixed(2)},${cy.toFixed(2)} L ${cx.toFixed(2)},${(cy + radius).toFixed(2)} L ${(cx - radius).toFixed(2)},${cy.toFixed(2)} Z`;
}

/** Erzeugt einen ausgeblendeten Steg mit wenigen kleinen, zentrierten Rauten. */
export function islamischerZierstreifen(breite: number, hoehe: number, anzahlRauten = 3): Zierstreifen {
  const cy = hoehe / 2;
  const radius = hoehe * 0.24;
  const mitte = breite / 2;
  const abstand = hoehe * 2.2;
  const start = -((anzahlRauten - 1) / 2) * abstand;

  const rauten: string[] = [];
  for (let i = 0; i < anzahlRauten; i++) {
    rauten.push(rautePfad(mitte + start + i * abstand, cy, radius));
  }

  return {
    linie: { x1: 0, y1: cy, x2: breite, y2: cy },
    rauten,
  };
}
