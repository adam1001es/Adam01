import React from "react";
import { Svg, Path, G, View } from "@react-pdf/renderer";
import {
  MUSTERSTREIFEN_KACHEL_BREITE,
  MUSTERSTREIFEN_KACHEL_HOEHE,
  MUSTERSTREIFEN_STERN_PFAD,
  MUSTERSTREIFEN_HEXAGON_PFAD,
  MUSTERSTREIFEN_RAHMEN_Y,
} from "@/lib/patternStrip";

/**
 * react-pdf kennt kein SVG-<pattern> - die Kachel wird daher explizit so oft wiederholt, wie in
 * die (zur Renderzeit bekannte, feste Seitenbreite abzüglich Rand) verfügbare Breite passt, und
 * am rechten Rand über eine überflüssige Kachel plus `overflow: hidden` sauber abgeschnitten.
 */
export function IslamicPatternStripPdf({
  color = "#1a1a1a",
  hoehe = 16,
  breite,
}: {
  color?: string;
  hoehe?: number;
  breite: number;
}) {
  const skalierung = hoehe / MUSTERSTREIFEN_KACHEL_HOEHE;
  const kachelBreitePt = MUSTERSTREIFEN_KACHEL_BREITE * skalierung;
  const anzahl = Math.ceil(breite / kachelBreitePt) + 1;
  const gesamtBreite = anzahl * MUSTERSTREIFEN_KACHEL_BREITE;
  const [rahmenO1, rahmenO2, rahmenU1, rahmenU2] = MUSTERSTREIFEN_RAHMEN_Y;

  return (
    <View style={{ width: breite, height: hoehe, overflow: "hidden" }}>
      <Svg
        viewBox={`0 0 ${gesamtBreite} ${MUSTERSTREIFEN_KACHEL_HOEHE}`}
        style={{ width: anzahl * kachelBreitePt, height: hoehe }}
      >
        <G stroke={color} fill="none" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round">
          {Array.from({ length: anzahl }).map((_, k) => (
            <G key={k} transform={`translate(${k * MUSTERSTREIFEN_KACHEL_BREITE},0)`}>
              <Path d={MUSTERSTREIFEN_STERN_PFAD} />
              <Path d={MUSTERSTREIFEN_HEXAGON_PFAD} />
            </G>
          ))}
          <Path d={`M 0,${rahmenO1} L ${gesamtBreite},${rahmenO1}`} />
          <Path d={`M 0,${rahmenO2} L ${gesamtBreite},${rahmenO2}`} />
          <Path d={`M 0,${rahmenU1} L ${gesamtBreite},${rahmenU1}`} />
          <Path d={`M 0,${rahmenU2} L ${gesamtBreite},${rahmenU2}`} />
        </G>
      </Svg>
    </View>
  );
}
