/**
 * Dezentes, edles islamisches Ornament: ein achtzackiger Stern ("Chatam"-Motiv, klassisches
 * Grundmuster islamischer Geometrie - zwei um 45° versetzte Quadrate), fein konturiert
 * (nur Kontur, keine Füllung) und durch einen dünnen Faden verbunden - wie eine Kette aus
 * kleinen Ornamenten. Bewusst rein rechnerisch erzeugt, kein Bild-Asset nötig.
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
  cy: number;
  points: string;
}

export interface GirihFaden {
  sterne: MusterStern[];
  fadenY: number;
}

/** Erzeugt einen dünnen "Faden" mit fein konturierten Sternen als Zier-Streifen. */
export function girihFaden(breite: number, hoehe: number, anzahl = 11): GirihFaden {
  const aussenRadius = hoehe * 0.3;
  const innenRadius = aussenRadius * 0.42;
  const abstand = breite / anzahl;
  const cy = hoehe / 2;
  const sterne: MusterStern[] = [];
  for (let i = 0; i < anzahl; i++) {
    const cx = abstand * i + abstand / 2;
    sterne.push({ cx, cy, points: achtzackigerSternPunkte(cx, cy, aussenRadius, innenRadius) });
  }
  return { sterne, fadenY: cy };
}
