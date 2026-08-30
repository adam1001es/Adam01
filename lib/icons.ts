/**
 * Kuratierte, handgezeichnete Bild-Symbole (Strichzeichnungen, schwarz auf transparent) für
 * bildbasierte Aufgaben (Ausmalbild, Bildergeschichte) - gedacht für Schüler:innen der
 * 1./2. Klasse Volksschule, die noch nicht lesen/schreiben können. Bewusst neutrale,
 * altersgerechte Motive ohne Gottesname/Koran-Text (gleiche Begründung wie beim Musterwort:
 * Arbeitsblätter landen im Schulalltag auch mal am Boden). Einmalig serverseitig als PNG
 * gerendert (siehe README), damit Web/PDF/Word exakt dasselbe Bild verwenden.
 */

export const ICON_KEYS = [
  "halbmond",
  "stern",
  "moschee",
  "laterne",
  "herz",
  "buch",
  "sonne",
  "wassertropfen",
  "familie",
  "teppich",
] as const;
export type IconKey = (typeof ICON_KEYS)[number];

export const ICONS: Record<IconKey, { label: string; seitenverhaeltnis: number }> = {
  halbmond: { label: "Halbmond", seitenverhaeltnis: 342 / 492 },
  stern: { label: "Stern", seitenverhaeltnis: 540 / 522 },
  moschee: { label: "Moschee", seitenverhaeltnis: 534 / 510 },
  laterne: { label: "Laterne", seitenverhaeltnis: 228 / 558 },
  herz: { label: "Herz", seitenverhaeltnis: 528 / 498 },
  buch: { label: "Buch", seitenverhaeltnis: 468 / 415 },
  sonne: { label: "Sonne", seitenverhaeltnis: 528 / 528 },
  wassertropfen: { label: "Wassertropfen", seitenverhaeltnis: 348 / 507 },
  familie: { label: "Familie", seitenverhaeltnis: 501 / 510 },
  teppich: { label: "Gebetsteppich", seitenverhaeltnis: 408 / 468 },
};

export function iconPfadWeb(key: IconKey): string {
  return `/icons/${key}.png`;
}

/** Pfad für ein live per Bild-KI generiertes, sicherheitsgeprüftes Motiv (siehe
 * lib/imageGen.ts) - ausgeliefert über app/api/generated-image/[id]. */
export function generiertesBildPfadWeb(id: string): string {
  return `/api/generated-image/${id}`;
}
