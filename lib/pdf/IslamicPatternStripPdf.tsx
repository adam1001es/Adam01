import React from "react";
import { Svg, Path, Line, View } from "@react-pdf/renderer";
import { islamischesSternband } from "@/lib/geometricPattern";

const BREITE = 500;
const HOEHE = 22;

export function IslamicPatternStripPdf({
  color = "#9c7a2c",
  anzahl = 7,
}: {
  color?: string;
  anzahl?: number;
}) {
  const { linie, sterne, rauten } = islamischesSternband(BREITE, HOEHE, anzahl);

  return (
    <View style={{ width: "100%", height: HOEHE }}>
      <Svg viewBox={`0 0 ${BREITE} ${HOEHE}`} style={{ width: "100%", height: HOEHE }}>
        <Line
          x1={linie.x1}
          y1={linie.y1}
          x2={linie.x2}
          y2={linie.y2}
          stroke={color}
          strokeWidth={0.5}
          opacity={0.4}
        />
        {sterne.map((d, i) => (
          <Path key={i} d={d} fill="#fdfbf5" stroke={color} strokeWidth={1.1} />
        ))}
        {rauten.map((d, i) => (
          <Path key={i} d={d} fill={color} opacity={0.65} />
        ))}
      </Svg>
    </View>
  );
}
