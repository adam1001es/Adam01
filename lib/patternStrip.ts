import { MusterVariante } from "@/lib/types";

/**
 * Islamische Musterelemente: vier auswählbare, horizontal durchlaufende Zierstreifen im
 * Girih-Stil (wie klassische maurische/Alhambra-Randmuster). Drei davon ("sterne", "sechseck",
 * "kalligrafie") sind echte Kachelmuster - eine Kachel wird so oft nebeneinandergesetzt, wie in
 * die verfügbare Breite passt, ohne Verzerrung. "verlauf" ist kein Kachelmuster, sondern ein
 * einzelnes, symmetrisches Motiv, das in der Mitte am dichtesten ist und zu beiden Rändern hin
 * an Dichte verliert, bis es spitz ausläuft - skaliert direkt (ohne Wiederholung) auf die volle
 * Breite.
 */

export interface MusterPfadGruppe {
  /** Strichstärke im Kachel-/Motiv-Koordinatensystem. */
  strichstaerke: number;
  pfade: string[];
}

export interface KachelMusterDefinition {
  art: "kachel";
  kachelBreite: number;
  kachelHoehe: number;
  /** Y-Koordinaten der Rahmenlinie oben/unten. */
  rahmenY: readonly [number, number];
  rahmenStrichstaerke: number;
  gruppen: MusterPfadGruppe[];
}

export interface VerlaufMusterDefinition {
  art: "verlauf";
  breite: number;
  hoehe: number;
  gruppen: MusterPfadGruppe[];
}

export type MusterDefinition = KachelMusterDefinition | VerlaufMusterDefinition;

export const MUSTER_LABEL: Record<MusterVariante, string> = {
  sterne: "Sterne",
  sechseck: "Sechseck",
  kalligrafie: "Kalligrafie",
  verlauf: "Verlauf",
};

export const MUSTER_DEFINITIONEN: Record<MusterVariante, MusterDefinition> = {
  // Achtzackiger Stern mit innerem Kern, ineinandergreifende Rauten-/Vieleck-Formen.
  sterne: {
    art: "kachel",
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
  // Längliche Sechseck-Kachel mit eingeschriebenem sechszackigen Stern.
  sechseck: {
    art: "kachel",
    kachelBreite: 90,
    kachelHoehe: 56,
    rahmenY: [1, 55],
    rahmenStrichstaerke: 1.6,
    gruppen: [
      {
        strichstaerke: 1.15,
        pfade: [
          "M0,28 L18,10 L72,10 L90,28 L72,46 L18,46 Z",
          "M18,5 L24,10 L18,15 L12,10 Z",
          "M72,5 L78,10 L72,15 L66,10 Z",
          "M18,41 L24,46 L18,51 L12,46 Z",
          "M72,41 L78,46 L72,51 L66,46 Z",
        ],
      },
      {
        strichstaerke: 1.0,
        pfade: [
          "M45,13 L48.5,21.94 L57.99,20.5 L52,28 L57.99,35.5 L48.5,34.06 L45,43 L41.5,34.06 L32.01,35.5 L38,28 L32.01,20.5 L41.5,21.94 Z",
          "M45,18 L53.66,23 L53.66,33 L45,38 L36.34,33 L36.34,23 Z",
        ],
      },
    ],
  },
  // Stilisiertes و (waw) im Wechsel mit einem achtzackigen Stern an der Kachelnaht.
  kalligrafie: {
    art: "kachel",
    kachelBreite: 90,
    kachelHoehe: 56,
    rahmenY: [1, 55],
    rahmenStrichstaerke: 1.6,
    gruppen: [
      {
        strichstaerke: 1.15,
        pfade: [
          "M44,25 C44,18.9247 48.9247,14 55,14 C61.0753,14 66,18.9247 66,25 C66,31.0753 61.0753,36 55,36 C48.9247,36 44,31.0753 44,25 Z",
          "M60.5,34.57 C56,44 39,46 35,38 C33,33 38,31 43,33",
          "M45,6 L50,11 L45,16 L40,11 Z",
          "M45,40 L50,45 L45,50 L40,45 Z",
        ],
      },
      {
        strichstaerke: 1.0,
        pfade: [
          "M0,15 L2.3,22.46 L9.19,18.81 L5.54,25.7 L13,28 L5.54,30.3 L9.19,37.19 L2.3,33.54 L0,41 L-2.3,33.54 L-9.19,37.19 L-5.54,30.3 L-13,28 L-5.54,25.7 L-9.19,18.81 L-2.3,22.46 Z",
        ],
      },
    ],
  },
  // Nicht kachelbar: ein Motiv, das in der Mitte am dichtesten ist und zu den (spitz
  // zulaufenden) Rändern hin an Dichte verliert - skaliert direkt auf die volle Breite.
  verlauf: {
    art: "verlauf",
    breite: 1000,
    hoehe: 48,
    gruppen: [
      {
        strichstaerke: 1.15,
        pfade: [
          "M500,7 L503.06,16.61 L512.02,11.98 L507.39,20.94 L517,24 L507.39,27.06 L512.02,36.02 L503.06,31.39 L500,41 L496.94,31.39 L487.98,36.02 L492.61,27.06 L483,24 L492.61,20.94 L487.98,11.98 L496.94,16.61 Z",
          "M500,10.5 L505,15.5 L500,20.5 L495,15.5 Z",
          "M500,27.5 L505,32.5 L500,37.5 L495,32.5 Z",
          "M465,16 L471,24 L465,32 L459,24 Z",
          "M535,16 L541,24 L535,32 L529,24 Z",
          "M445,16 L421.67,32 L398.33,16 L375,32",
          "M555,16 L578.33,32 L601.67,16 L625,32",
          "M340,11 L350,24 L340,37 L330,24 Z",
          "M660,11 L670,24 L660,37 L650,24 Z",
          "M250,18 L256,24 L250,30 L244,24 Z",
          "M750,18 L756,24 L750,30 L744,24 Z",
          "M220,20 L0,24 L220,28",
          "M780,20 L1000,24 L780,28",
        ],
      },
    ],
  },
};
