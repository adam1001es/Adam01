/**
 * Dezentes islamisches Ornament: eine dünne Kette aus achtzackigen Sternen (khatam-Stern-Motiv)
 * mit kleinen Rauten dazwischen, wie man es von klassischer Zellige-/Girih-Fliesenkunst kennt -
 * hier stark reduziert auf einen schmalen, einfarbigen (Gold-)Streifen statt einer flächigen,
 * bunten Fliesenverzierung. Rein geometrisch (Polygone), keine Schrift, keine religiösen Symbole
 * oder Namen - rechnerisch erzeugt, kein Bild-Asset nötig.
 */

export interface Sternband {
  linie: { x1: number; y1: number; x2: number; y2: number };
  sterne: string[]; // SVG-Pfad ("d") je Stern
  rauten: string[]; // SVG-Pfad ("d") je Verbindungs-Raute
}

function sternPfad(cx: number, cy: number, radius: number, drehungGrad: number, innerRatio = 0.5): string {
  const spitzen = 8;
  const n = spitzen * 2;
  const drehung = (drehungGrad * Math.PI) / 180;
  const punkte: string[] = [];
  for (let i = 0; i < n; i++) {
    const winkel = (Math.PI * 2 * i) / n - Math.PI / 2 + drehung;
    const r = i % 2 === 0 ? radius : radius * innerRatio;
    const x = cx + r * Math.cos(winkel);
    const y = cy + r * Math.sin(winkel);
    punkte.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${punkte.join(" L ")} Z`;
}

function rautePfad(cx: number, cy: number, radius: number): string {
  return `M ${cx.toFixed(2)},${(cy - radius).toFixed(2)} L ${(cx + radius).toFixed(2)},${cy.toFixed(2)} L ${cx.toFixed(2)},${(cy + radius).toFixed(2)} L ${(cx - radius).toFixed(2)},${cy.toFixed(2)} Z`;
}

/** Erzeugt eine Reihe gleichmäßig verteilter, alternierend gedrehter Sterne mit kleinen Rauten dazwischen. */
export function islamischesSternband(breite: number, hoehe: number, anzahl = 8): Sternband {
  const cy = hoehe / 2;
  const radius = hoehe * 0.46;
  const abstand = breite / anzahl;

  const sterne: string[] = [];
  const rauten: string[] = [];
  for (let i = 0; i < anzahl; i++) {
    const cx = abstand * (i + 0.5);
    const drehung = i % 2 === 0 ? 0 : 22.5;
    sterne.push(sternPfad(cx, cy, radius, drehung));
    if (i < anzahl - 1) {
      rauten.push(rautePfad(cx + abstand / 2, cy, hoehe * 0.11));
    }
  }

  return {
    linie: { x1: 0, y1: cy, x2: breite, y2: cy },
    sterne,
    rauten,
  };
}
