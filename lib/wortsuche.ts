/**
 * Erzeugt aus einer Wortliste (von Claude vorgeschlagen) ein Buchstabengitter zum Suchen -
 * bewusst NICHT von Claude selbst generieren lassen: ein Sprachmodell kann Wörter zuverlässig
 * nennen, aber kein konsistentes, überschneidungsfreies Buchstabengitter von Hand "layouten".
 * Wird EINMALIG serverseitig direkt nach der Generierung aufgelöst (wie generierte Ausmalbilder,
 * siehe lib/generateWorksheet.ts) und das Ergebnis in der Aufgabe gespeichert, damit Web/PDF/Word
 * exakt dasselbe Gitter zeigen.
 */

type Richtung = { dr: number; dc: number };

const RICHTUNGEN: Richtung[] = [
  { dr: 0, dc: 1 }, // rechts
  { dr: 1, dc: 0 }, // runter
  { dr: 1, dc: 1 }, // diagonal runter-rechts
  { dr: 1, dc: -1 }, // diagonal runter-links
];

const MAX_VERSUCHE_PRO_WORT = 200;

/** Nur A-Z im Gitter - Umlaute/ß werden lautgetreu ersetzt, alles andere entfernt. */
export function normalisiereWort(wort: string): string {
  return wort
    .replace(/ä/gi, "ae")
    .replace(/ö/gi, "oe")
    .replace(/ü/gi, "ue")
    .replace(/ß/gi, "ss")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

function erzeugeSeed(woerter: string[]): number {
  return woerter.reduce((summe, w) => summe + w.length, woerter.length * 49297) * 9301 + 7;
}

function macheZufallsgenerator(seed: number): () => number {
  let zustand = seed;
  return () => {
    zustand = (zustand * 9301 + 49297) % 233280;
    return zustand / 233280;
  };
}

function startBereich(wortlaenge: number, delta: number, groesse: number): [number, number] {
  if (delta === 0) return [0, groesse - 1];
  if (delta > 0) return [0, groesse - wortlaenge];
  return [wortlaenge - 1, groesse - 1];
}

function passtWort(
  gitter: (string | null)[][],
  wort: string,
  startRow: number,
  startCol: number,
  richtung: Richtung,
): boolean {
  for (let i = 0; i < wort.length; i++) {
    const bestehend = gitter[startRow + richtung.dr * i][startCol + richtung.dc * i];
    if (bestehend !== null && bestehend !== wort[i]) return false;
  }
  return true;
}

function platziereWort(
  gitter: (string | null)[][],
  wort: string,
  startRow: number,
  startCol: number,
  richtung: Richtung,
): void {
  for (let i = 0; i < wort.length; i++) {
    gitter[startRow + richtung.dr * i][startCol + richtung.dc * i] = wort[i];
  }
}

export function erzeugeWortsucheGitter(
  woerterRoh: string[],
): { gitter: string[][]; platzierteWoerter: string[] } | null {
  const woerter = Array.from(new Set(woerterRoh.map(normalisiereWort).filter((w) => w.length >= 3)))
    .filter((w) => w.length <= 12)
    .sort((a, b) => b.length - a.length);
  if (woerter.length === 0) return null;

  const groesse = Math.max(10, Math.min(16, woerter[0].length + 3));
  const gitter: (string | null)[][] = Array.from({ length: groesse }, () => Array(groesse).fill(null));
  const zufall = macheZufallsgenerator(erzeugeSeed(woerter));

  const platzierteWoerter: string[] = [];

  for (const wort of woerter) {
    if (wort.length > groesse) continue;
    let platziert = false;
    for (let versuch = 0; versuch < MAX_VERSUCHE_PRO_WORT && !platziert; versuch++) {
      const richtung = RICHTUNGEN[Math.floor(zufall() * RICHTUNGEN.length)];
      const [rowMin, rowMax] = startBereich(wort.length, richtung.dr, groesse);
      const [colMin, colMax] = startBereich(wort.length, richtung.dc, groesse);
      const startRow = rowMin + Math.floor(zufall() * (rowMax - rowMin + 1));
      const startCol = colMin + Math.floor(zufall() * (colMax - colMin + 1));
      if (passtWort(gitter, wort, startRow, startCol, richtung)) {
        platziereWort(gitter, wort, startRow, startCol, richtung);
        platziert = true;
        platzierteWoerter.push(wort);
      }
    }
  }

  if (platzierteWoerter.length === 0) return null;

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const fertigesGitter: string[][] = gitter.map((zeile) =>
    zeile.map((zelle) => zelle ?? ALPHABET[Math.floor(zufall() * ALPHABET.length)]),
  );

  return { gitter: fertigesGitter, platzierteWoerter };
}
