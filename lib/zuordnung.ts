import { Aufgabe } from "./types";

const BUCHSTABEN = "abcdefghijklmnopqrstuvwxyz";

export type ZuordnungAnzeige = {
  links: { nummer: number; text: string }[];
  rechts: { buchstabe: string; text: string }[];
};

/**
 * Bereitet eine "zuordnung"-Aufgabe fürs Drucken auf: linke Spalte nummeriert (1, 2, 3, ...) mit
 * Schreibfeld für den passenden Buchstaben, rechte Spalte gemischt und mit Buchstaben (a, b, c,
 * ...) versehen - statt beide Spalten in Original-Reihenfolge nebeneinander mit einer
 * Verbindungslinie zu zeigen. Zwei Gründe: bei langen Texten lassen sich Linien schlecht
 * sauber ziehen, und die Original-Reihenfolge (links[i] passt zu rechts[i]) würde die Lösung
 * schon auf dem Blatt verraten, statt eine echte Zuordnungsaufgabe zu sein.
 *
 * Die Mischung ist deterministisch (aus Aufgaben-Nr. + Länge abgeleitet), damit Web-Ansicht,
 * PDF und Word exakt dieselbe Buchstaben-Reihenfolge zeigen, obwohl jede Darstellung die
 * Funktion unabhängig aufruft. Die Lösung selbst bleibt der von Claude generierte Klartext im
 * "loesungen"-Feld (nennt die Paare inhaltlich, nicht über Nummern/Buchstaben) und bleibt daher
 * unabhängig von dieser Mischreihenfolge korrekt.
 */
export function zuordnungAnzeige(a: Aufgabe): ZuordnungAnzeige | null {
  const links = a.zuordnungLinks;
  const rechts = a.zuordnungRechts;
  if (!links || !rechts || links.length === 0 || links.length !== rechts.length) return null;

  const indices = rechts.map((_, i) => i);
  let seed = (a.nr + 1) * 9301 + links.length * 49297;
  const naechsterZufallswert = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(naechsterZufallswert() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // Falls die Mischung zufällig der Original-Reihenfolge entspricht, einmal rotieren, damit die
  // Zuordnung nicht trivial (1↔a, 2↔b, ...) bleibt.
  if (indices.length > 1 && indices.every((v, i) => v === i)) {
    indices.push(indices.shift()!);
  }

  return {
    links: links.map((text, i) => ({ nummer: i + 1, text })),
    rechts: indices.map((originalIndex, i) => ({
      buchstabe: BUCHSTABEN[i] ?? String(i + 1),
      text: rechts[originalIndex],
    })),
  };
}
