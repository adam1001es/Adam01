import React from "react";
import { Svg, Path, G, View } from "@react-pdf/renderer";
import {
  MUSTERSTREIFEN_KACHEL_BREITE,
  MUSTERSTREIFEN_KACHEL_HOEHE,
  MUSTERSTREIFEN_RAHMEN_Y,
  MUSTERSTREIFEN_RAHMEN_STRICHSTAERKE,
  MUSTERSTREIFEN_HAUPT_PFADE,
  MUSTERSTREIFEN_HAUPT_STRICHSTAERKE,
  MUSTERSTREIFEN_INNEN_PFADE,
  MUSTERSTREIFEN_INNEN_STRICHSTAERKE,
  MUSTERSTREIFEN_FEIN_PFADE,
  MUSTERSTREIFEN_FEIN_STRICHSTAERKE,
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
  const [rahmenOben, rahmenUnten] = MUSTERSTREIFEN_RAHMEN_Y;

  return (
    <View style={{ width: breite, height: hoehe, overflow: "hidden" }}>
      <Svg
        viewBox={`0 0 ${gesamtBreite} ${MUSTERSTREIFEN_KACHEL_HOEHE}`}
        style={{ width: anzahl * kachelBreitePt, height: hoehe }}
      >
        <G fill="none" stroke={color} strokeLinejoin="miter" strokeLinecap="round">
          {Array.from({ length: anzahl }).map((_, k) => (
            <G key={k} transform={`translate(${k * MUSTERSTREIFEN_KACHEL_BREITE},0)`}>
              <G strokeWidth={MUSTERSTREIFEN_HAUPT_STRICHSTAERKE}>
                {MUSTERSTREIFEN_HAUPT_PFADE.map((d, i) => (
                  <Path key={i} d={d} />
                ))}
              </G>
              <G strokeWidth={MUSTERSTREIFEN_INNEN_STRICHSTAERKE}>
                {MUSTERSTREIFEN_INNEN_PFADE.map((d, i) => (
                  <Path key={i} d={d} />
                ))}
              </G>
              <G strokeWidth={MUSTERSTREIFEN_FEIN_STRICHSTAERKE}>
                {MUSTERSTREIFEN_FEIN_PFADE.map((d, i) => (
                  <Path key={i} d={d} />
                ))}
              </G>
            </G>
          ))}
          <G strokeWidth={MUSTERSTREIFEN_RAHMEN_STRICHSTAERKE}>
            <Path d={`M 0,${rahmenOben} L ${gesamtBreite},${rahmenOben}`} />
            <Path d={`M 0,${rahmenUnten} L ${gesamtBreite},${rahmenUnten}`} />
          </G>
        </G>
      </Svg>
    </View>
  );
}
