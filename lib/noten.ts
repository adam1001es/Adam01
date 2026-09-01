/**
 * Leitet aus einem Ergebnis-Prozentwert (siehe Prisma-Modell Ergebnis, app/klassen) einen
 * österreichischen Notenvorschlag (1 Sehr gut - 5 Nicht genügend) ab. Bewusst nur eine
 * Anzeige-Ableitung, KEINE gespeicherte Größe (siehe Ergebnis.prozent) - ein späterer Wechsel des
 * Schlüssels wirkt sich damit sofort auf alle bestehenden Ergebnisse aus, statt alte Datensätze
 * mit dem damaligen Schlüssel "einzufrieren".
 *
 * Die Prozentgrenzen entsprechen keinem gesetzlich vorgeschriebenen Schlüssel - Schulen und
 * Lehrkräfte legen das in Österreich selbst fest. Verwendet wird hier ein verbreitetes,
 * "klassisches" Schema (grob 10-Prozentpunkt-Schritte ab 50%) als Orientierung - NIRGENDS als
 * offizielle Beurteilung ausgeben, immer klar als Richtwert kennzeichnen (siehe NOTE_LABEL für
 * den entsprechenden UI-Text).
 */

export const AUSTRIA_NOTENSCHLUESSEL = [
  { note: 1, abProzent: 87, label: "Sehr gut" },
  { note: 2, abProzent: 73, label: "Gut" },
  { note: 3, abProzent: 59, label: "Befriedigend" },
  { note: 4, abProzent: 44, label: "Genügend" },
  { note: 5, abProzent: 0, label: "Nicht genügend" },
] as const;

export type Note = (typeof AUSTRIA_NOTENSCHLUESSEL)[number]["note"];

export const NOTE_LABEL: Record<Note, string> = Object.fromEntries(
  AUSTRIA_NOTENSCHLUESSEL.map((stufe) => [stufe.note, stufe.label]),
) as Record<Note, string>;

/** Ordnet einen Prozentwert (0-100) der passenden Note zu - Werte außerhalb des Bereichs werden
 * geklemmt statt einen Fehler zu werfen, da Eingaben aus einem freien Zahlenfeld kommen. */
export function prozentZuNote(prozent: number): Note {
  const geklemmt = Math.max(0, Math.min(100, prozent));
  const stufe = AUSTRIA_NOTENSCHLUESSEL.find((s) => geklemmt >= s.abProzent);
  return stufe?.note ?? 5;
}
