/** Formen-Katalog für das Kästchen-Puzzle "Wissensblöcke" (siehe components/WissensBloecke.tsx).
 * Jede Form ist eine Liste von [Zeile, Spalte]-Versätzen relativ zum Anker (0,0), auf das
 * Minimum normalisiert. "schwierigkeit" steuert, aus welchem Topf eine Form gezogen wird: bei
 * richtiger Antwort darf man frei aus überwiegend leicht/mittel wählen, bei falscher Antwort
 * kommt ungefragt eine der "schwer" getaggten (größeren/unregelmäßigeren) Formen. */

export interface Formteil {
  zellen: [number, number][];
  schwierigkeit: "leicht" | "mittel" | "schwer";
}

export const FORMEN: Formteil[] = [
  { zellen: [[0, 0]], schwierigkeit: "leicht" },
  { zellen: [[0, 0], [0, 1]], schwierigkeit: "leicht" },
  { zellen: [[0, 0], [1, 0]], schwierigkeit: "leicht" },
  { zellen: [[0, 0], [0, 1], [0, 2]], schwierigkeit: "mittel" },
  { zellen: [[0, 0], [1, 0], [2, 0]], schwierigkeit: "mittel" },
  { zellen: [[0, 0], [0, 1], [1, 0]], schwierigkeit: "mittel" },
  { zellen: [[0, 0], [0, 1], [1, 1]], schwierigkeit: "mittel" },
  { zellen: [[0, 0], [1, 0], [1, 1]], schwierigkeit: "mittel" },
  { zellen: [[0, 1], [1, 0], [1, 1]], schwierigkeit: "mittel" },
  { zellen: [[0, 0], [0, 1], [1, 0], [1, 1]], schwierigkeit: "mittel" },
  { zellen: [[0, 0], [0, 1], [0, 2], [0, 3]], schwierigkeit: "schwer" },
  { zellen: [[0, 0], [1, 0], [2, 0], [3, 0]], schwierigkeit: "schwer" },
  { zellen: [[0, 0], [0, 1], [0, 2], [1, 1]], schwierigkeit: "schwer" },
  { zellen: [[0, 1], [0, 2], [1, 0], [1, 1]], schwierigkeit: "schwer" },
  { zellen: [[0, 0], [0, 1], [1, 1], [1, 2]], schwierigkeit: "schwer" },
  { zellen: [[0, 0], [1, 0], [2, 0], [2, 1]], schwierigkeit: "schwer" },
  { zellen: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]], schwierigkeit: "schwer" },
  { zellen: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]], schwierigkeit: "schwer" },
];

export const FARBPALETTE = [
  "#0ea5e9",
  "#f97316",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#eab308",
  "#ef4444",
  "#14b8a6",
];

export function zufallsFarbe(): string {
  return FARBPALETTE[Math.floor(Math.random() * FARBPALETTE.length)];
}

export function formGroesse(form: Formteil): { zeilen: number; spalten: number } {
  const maxR = Math.max(...form.zellen.map(([r]) => r));
  const maxC = Math.max(...form.zellen.map(([, c]) => c));
  return { zeilen: maxR + 1, spalten: maxC + 1 };
}

function formenNachSchwierigkeit(...stufen: Formteil["schwierigkeit"][]): Formteil[] {
  return FORMEN.filter((f) => stufen.includes(f.schwierigkeit));
}

export function dreiAuswahlFormen(): Formteil[] {
  const pool = formenNachSchwierigkeit("leicht", "mittel");
  const ergebnis: Formteil[] = [];
  for (let i = 0; i < 3; i++) {
    ergebnis.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return ergebnis;
}

export function zufallsSchwereForm(): Formteil {
  const pool = formenNachSchwierigkeit("schwer");
  return pool[Math.floor(Math.random() * pool.length)];
}
