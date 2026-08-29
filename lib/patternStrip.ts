/**
 * Islamisches Musterelement: ein einfacher, horizontaler Zierstreifen, der über die volle Breite
 * des Arbeitsblatts verläuft und an beiden Enden spitz ausläuft - kein 1:1-Ausschnitt der vom
 * Nutzer bereitgestellten Referenzvorlage, sondern eine eigene, schlanke Neuzeichnung, die deren
 * Formensprache aufgreift: ein achtzackiger Stern in der Mitte, kleine und größere Rauten,
 * Zickzack-Verbindungslinien und eine doppelte, spitz zulaufende Linienführung an den Enden.
 * Als Vektor (Web/PDF) skaliert das beliebig auf die tatsächliche Breite, ohne zu verzerren -
 * anders als ein Rasterbild des dichten Original-Ecksausschnitts.
 */

export const MUSTERSTREIFEN_VIEWBOX = "0 0 1000 48";

export const MUSTERSTREIFEN_PFADE: string[] = [
  // Achtzackiger Stern in der Mitte
  "M 500,8 L 502.68,17.53 L 511.31,12.69 L 506.47,21.32 L 516,24 L 506.47,26.68 L 511.31,35.31 L 502.68,30.47 L 500,40 L 497.32,30.47 L 488.69,35.31 L 493.53,26.68 L 484,24 L 493.53,21.32 L 488.69,12.69 L 497.32,17.53 Z",
  // Kleine Rauten direkt neben dem Stern
  "M 470,17 L 475,24 L 470,31 L 465,24 Z",
  "M 530,17 L 535,24 L 530,31 L 525,24 Z",
  // Zickzack-Verbindungen
  "M 455,16 L 431.67,32 L 408.33,16 L 385,32",
  "M 545,16 L 568.33,32 L 591.67,16 L 615,32",
  // Größere Rauten
  "M 320,12 L 329,24 L 320,36 L 311,24 Z",
  "M 680,12 L 689,24 L 680,36 L 671,24 Z",
  // Doppelte Linie, spitz zulaufend zu den Rändern
  "M 300,18 L 0,24 L 300,30",
  "M 700,18 L 1000,24 L 700,30",
];
