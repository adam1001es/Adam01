import { MusterVariante } from "@/lib/types";

/**
 * Islamische Musterelemente: vier auswählbare, horizontal durchlaufende Zierstreifen im
 * Girih-Stil (wie klassische maurische/Alhambra-Randmuster). Jede Variante ist ein echtes
 * Kachelmuster - eine Kachel wird so oft nebeneinandergesetzt, wie in die verfügbare Breite
 * passt, ohne Verzerrung.
 */

export interface MusterPfadGruppe {
  /** Strichstärke im Kachel-Koordinatensystem. */
  strichstaerke: number;
  pfade: string[];
}

export interface MusterDefinition {
  kachelBreite: number;
  kachelHoehe: number;
  /** Y-Koordinaten der Rahmenlinie oben/unten. */
  rahmenY: readonly [number, number];
  rahmenStrichstaerke: number;
  gruppen: MusterPfadGruppe[];
}

export const MUSTER_LABEL: Record<MusterVariante, string> = {
  sterne: "Sterne",
  halbmond: "Halbmond",
  kalligrafie: "Kalligrafie",
  kette: "Kette",
};

export const MUSTER_DEFINITIONEN: Record<MusterVariante, MusterDefinition> = {
  // Achtzackiger Stern mit innerem Kern, ineinandergreifende Rauten-/Vieleck-Formen.
  sterne: {
    kachelBreite: 80,
    kachelHoehe: 56,
    rahmenY: [1, 55],
    rahmenStrichstaerke: 1.6,
    gruppen: [
      {
        strichstaerke: 1.15,
        pfade: [
          "M12,28 L17.5,18.5 L27,16.5 L32,8 L40,13 L48,8 L53,16.5 L62.5,18.5 L68,28 L62.5,37.5 L53,39.5 L48,48 L40,43 L32,48 L27,39.5 L17.5,37.5 Z",
          "M0,10 L6,5 L14,8 L12,16 L4,16 Z",
          "M66,10 L74,5 L80,10 L76,16 L68,16 Z",
          "M0,46 L6,51 L14,48 L12,40 L4,40 Z",
          "M66,46 L74,51 L80,46 L76,40 L68,40 Z",
          "M0,28 L8,20 L16,28 L8,36 Z",
          "M64,28 L72,20 L80,28 L72,36 Z",
          "M40,4 L46,10 L40,15 L34,10 Z",
          "M40,41 L46,46 L40,52 L34,46 Z",
          "M18,10 L26,5 L34,10 L30,17 L22,17 Z",
          "M46,10 L54,5 L62,10 L58,17 L50,17 Z",
          "M18,46 L26,51 L34,46 L30,39 L22,39 Z",
          "M46,46 L54,51 L62,46 L58,39 L50,39 Z",
        ],
      },
      {
        strichstaerke: 1.0,
        pfade: [
          "M32,22 L40,16 L48,22 L40,28 Z",
          "M32,34 L40,28 L48,34 L40,40 Z",
          "M22,28 L29,22 L36,28 L29,34 Z",
          "M44,28 L51,22 L58,28 L51,34 Z",
        ],
      },
      {
        strichstaerke: 0.95,
        pfade: ["M10,16 L16,22", "M64,16 L70,22", "M10,40 L16,34", "M64,40 L70,34"],
      },
    ],
  },
  // Zwei Halbmonde flankieren eine Raute - der Halbmond ist als ein einziger, geschlossener
  // Pfad aus zwei gegenläufigen Bögen gezeichnet (nicht als zwei sich überlappende Kreise -
  // das würde bei fill="none" nur zwei offene Ringe statt einer Mondsichel ergeben).
  halbmond: {
    kachelBreite: 100,
    kachelHoehe: 52,
    rahmenY: [1.5, 50.5],
    rahmenStrichstaerke: 1.5,
    gruppen: [
      {
        strichstaerke: 1.3,
        pfade: [
          "M22,14 A13,13 0 1,0 22,38 A9,9 0 1,1 22,14 Z",
          "M78,14 A13,13 0 1,0 78,38 A9,9 0 1,1 78,14 Z",
        ],
      },
      {
        strichstaerke: 1.15,
        pfade: [
          "M42,26 L52,15 L62,26 L52,37 Z",
          "M52,20 L57,26 L52,32 L47,26 Z",
          "M30,26 H42",
          "M62,26 H70",
        ],
      },
    ],
  },
  // Stilisiertes arabisches و (waw) im Kern eines zwölfzackigen Sterns, flankiert von Rauten.
  kalligrafie: {
    kachelBreite: 120,
    kachelHoehe: 60,
    rahmenY: [1.5, 58.5],
    rahmenStrichstaerke: 1.55,
    gruppen: [
      {
        strichstaerke: 1.35,
        pfade: [
          "M60,8 L63.5,17.5 L72.5,13.5 L70,23 L80,25 L72.5,32.5 L78,40 L68,38.5 L67,48.5 L60,42 L53,48.5 L52,38.5 L42,40 L47.5,32.5 L40,25 L50,23 L47.5,13.5 L56.5,17.5 Z",
        ],
      },
      {
        strichstaerke: 1.4,
        pfade: ["M56,25 Q60,21 65,24 L65,36 Q61,40 56,37 M65,31 H70"],
      },
      {
        strichstaerke: 1.0,
        pfade: ["M51,30 A9,9 0 1,0 69,30 A9,9 0 1,0 51,30 Z"],
      },
      {
        strichstaerke: 1.15,
        pfade: ["M12,30 L20,22 L28,30 L20,38 Z", "M92,30 L100,22 L108,30 L100,38 Z"],
      },
      {
        strichstaerke: 1.1,
        pfade: ["M28,30 H38", "M82,30 H92"],
      },
    ],
  },
  // Halbmond (korrekt als ein Pfad aus zwei gegenläufigen Bögen), Rauten-Kette und kleine
  // Rauten-Akzente, verbunden durch dünne Linien.
  kette: {
    kachelBreite: 100,
    kachelHoehe: 52,
    rahmenY: [1.5, 50.5],
    rahmenStrichstaerke: 1.5,
    gruppen: [
      {
        strichstaerke: 1.25,
        pfade: ["M20,15 A11,11 0 1,0 20,37 A7.5,7.5 0 1,1 20,15 Z", "M38,26 L48,16 L58,26 L48,36 Z"],
      },
      {
        strichstaerke: 1.1,
        pfade: [
          "M48,21 L53,26 L48,31 L43,26 Z",
          "M68,18 L74,12 L80,18 L74,24 Z",
          "M68,34 L74,28 L80,34 L74,40 Z",
          "M30,26 H38",
          "M58,26 H66",
        ],
      },
    ],
  },
};
