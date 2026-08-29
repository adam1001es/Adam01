import React from "react";
import { Svg, Path, G, View } from "@react-pdf/renderer";
import { MusterVariante } from "@/lib/types";
import { MUSTER_DEFINITIONEN } from "@/lib/patternStrip";

/**
 * react-pdf kennt kein SVG-<pattern> - Kachelmuster werden daher explizit so oft wiederholt, wie
 * in die (zur Renderzeit bekannte, feste Seitenbreite abzüglich Rand) verfügbare Breite passt,
 * und am rechten Rand über eine überflüssige Kachel plus `overflow: hidden` sauber abgeschnitten.
 * Das nicht kachelbare "verlauf"-Motiv skaliert stattdessen direkt (ohne Wiederholung).
 */
export function IslamicPatternStripPdf({
  variante = "sterne",
  color = "#1a1a1a",
  hoehe = 16,
  breite,
}: {
  variante?: MusterVariante;
  color?: string;
  hoehe?: number;
  breite: number;
}) {
  const definition = MUSTER_DEFINITIONEN[variante];

  if (definition.art === "verlauf") {
    return (
      <Svg viewBox={`0 0 ${definition.breite} ${definition.hoehe}`} style={{ width: breite, height: hoehe }}>
        <G stroke={color} fill="none" strokeLinejoin="round" strokeLinecap="round">
          {definition.gruppen.map((gruppe, gi) => (
            <G key={gi} strokeWidth={gruppe.strichstaerke}>
              {gruppe.pfade.map((d, i) => (
                <Path key={i} d={d} />
              ))}
            </G>
          ))}
        </G>
      </Svg>
    );
  }

  const skalierung = hoehe / definition.kachelHoehe;
  const kachelBreitePt = definition.kachelBreite * skalierung;
  const anzahl = Math.ceil(breite / kachelBreitePt) + 1;
  const gesamtBreite = anzahl * definition.kachelBreite;
  const [rahmenOben, rahmenUnten] = definition.rahmenY;

  return (
    <View style={{ width: breite, height: hoehe, overflow: "hidden" }}>
      <Svg
        viewBox={`0 0 ${gesamtBreite} ${definition.kachelHoehe}`}
        style={{ width: anzahl * kachelBreitePt, height: hoehe }}
      >
        <G fill="none" stroke={color} strokeLinejoin="miter" strokeLinecap="round">
          {Array.from({ length: anzahl }).map((_, k) => (
            <G key={k} transform={`translate(${k * definition.kachelBreite},0)`}>
              {definition.gruppen.map((gruppe, gi) => (
                <G key={gi} strokeWidth={gruppe.strichstaerke}>
                  {gruppe.pfade.map((d, i) => (
                    <Path key={i} d={d} />
                  ))}
                </G>
              ))}
            </G>
          ))}
          <G strokeWidth={definition.rahmenStrichstaerke}>
            <Path d={`M 0,${rahmenOben} L ${gesamtBreite},${rahmenOben}`} />
            <Path d={`M 0,${rahmenUnten} L ${gesamtBreite},${rahmenUnten}`} />
          </G>
        </G>
      </Svg>
    </View>
  );
}
