import React from "react";
import { Svg, Polygon } from "@react-pdf/renderer";
import { musterStreifen } from "@/lib/pattern";

const BREITE = 500;
const HOEHE = 12;

export function IslamicPatternStripPdf({
  color = "#0f9d58",
  opacity = 0.3,
  anzahl = 22,
}: {
  color?: string;
  opacity?: number;
  anzahl?: number;
}) {
  const sterne = musterStreifen(BREITE, HOEHE, anzahl);
  return (
    <Svg viewBox={`0 0 ${BREITE} ${HOEHE}`} style={{ width: "100%", height: HOEHE }}>
      {sterne.map((s, i) => (
        <Polygon key={i} points={s.points} fill={color} opacity={opacity} />
      ))}
    </Svg>
  );
}
