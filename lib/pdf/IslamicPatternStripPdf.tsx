import React from "react";
import { Svg, Polygon, Line } from "@react-pdf/renderer";
import { girihFaden } from "@/lib/pattern";

const BREITE = 500;
const HOEHE = 14;

export function IslamicPatternStripPdf({
  color = "#9c7a2c",
  opacity = 0.55,
  anzahl = 15,
}: {
  color?: string;
  opacity?: number;
  anzahl?: number;
}) {
  const { sterne, fadenY } = girihFaden(BREITE, HOEHE, anzahl);
  return (
    <Svg viewBox={`0 0 ${BREITE} ${HOEHE}`} style={{ width: "100%", height: HOEHE }}>
      <Line x1={0} y1={fadenY} x2={BREITE} y2={fadenY} stroke={color} strokeWidth={0.5} opacity={opacity} />
      {sterne.map((s, i) => (
        <Polygon
          key={i}
          points={s.points}
          fill="none"
          stroke={color}
          strokeWidth={0.75}
          opacity={opacity}
        />
      ))}
    </Svg>
  );
}
