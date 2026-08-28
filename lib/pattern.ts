/**
 * Punkte für einen achtzackigen Stern ("Chatam"-Motiv, klassisches Grundmuster islamischer
 * Geometrie - zwei um 45° versetzte Quadrate). Bewusst minimal und rein rechnerisch erzeugt,
 * kein Bild-Asset nötig - für Web-SVG, PDF-SVG und als Vorlage für Deko-Elemente.
 */
export function achtzackigerSternPunkte(
  cx: number,
  cy: number,
  aussenRadius: number,
  innenRadius: number,
): string {
  const zacken = 8;
  const punkte: string[] = [];
  for (let i = 0; i < zacken * 2; i++) {
    const radius = i % 2 === 0 ? aussenRadius : innenRadius;
    const winkel = (Math.PI / zacken) * i - Math.PI / 2;
    const x = cx + radius * Math.cos(winkel);
    const y = cy + radius * Math.sin(winkel);
    punkte.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return punkte.join(" ");
}

export interface MusterStern {
  cx: number;
  points: string;
}

/** Erzeugt eine Reihe gleichmäßig verteilter Sterne für einen Zier-Streifen der gegebenen Breite. */
export function musterStreifen(breite: number, hoehe: number, anzahl = 16): MusterStern[] {
  const aussenRadius = hoehe * 0.42;
  const innenRadius = aussenRadius * 0.42;
  const abstand = breite / anzahl;
  const sterne: MusterStern[] = [];
  for (let i = 0; i < anzahl; i++) {
    const cx = abstand * i + abstand / 2;
    sterne.push({ cx, points: achtzackigerSternPunkte(cx, hoehe / 2, aussenRadius, innenRadius) });
  }
  return sterne;
}
