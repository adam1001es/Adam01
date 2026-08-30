import { Aufgabe } from "./types";

/**
 * Bereitet eine "reihenfolge"-Aufgabe fürs Drucken auf: die von Claude in der RICHTIGEN
 * Reihenfolge gelieferten Elemente werden für die Anzeige gemischt, damit die Schüler:innen
 * die Reihenfolge tatsächlich herausfinden müssen (statt sie schon von oben nach unten
 * korrekt vorzufinden). Neben jedem Element bleibt beim Druck ein Schreibfeld für die
 * Rang-Zahl (1., 2., 3., ...).
 *
 * Deterministisch (aus Aufgaben-Nr. + Länge abgeleitet), damit Web, PDF und Word exakt
 * dieselbe Mischung zeigen, obwohl jede Darstellung die Funktion unabhängig aufruft. Die
 * Lösung selbst bleibt der von Claude generierte Klartext im "loesungen"-Feld (nennt die
 * richtige Reihenfolge inhaltlich) und bleibt daher unabhängig von dieser Mischung korrekt.
 */
export function reihenfolgeAnzeige(a: Aufgabe): string[] | null {
  const elemente = a.reihenfolgeElemente;
  if (!elemente || elemente.length < 2) return null;

  const indices = elemente.map((_, i) => i);
  let seed = (a.nr + 1) * 9301 + elemente.length * 49297;
  const naechsterZufallswert = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(naechsterZufallswert() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // Falls die Mischung zufällig der Original-Reihenfolge entspricht, einmal rotieren, damit die
  // Aufgabe nicht trivial (schon richtig von oben nach unten) bleibt.
  if (indices.every((v, i) => v === i)) {
    indices.push(indices.shift()!);
  }

  return indices.map((i) => elemente[i]);
}
