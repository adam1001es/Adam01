import React from "react";
import { Svg, Path, G } from "@react-pdf/renderer";
import { MUSTERSTREIFEN_VIEWBOX, MUSTERSTREIFEN_PFADE } from "@/lib/patternStrip";

export function IslamicPatternStripPdf({
  color = "#1a1a1a",
  hoehe = 16,
}: {
  color?: string;
  hoehe?: number;
}) {
  return (
    <Svg viewBox={MUSTERSTREIFEN_VIEWBOX} preserveAspectRatio="none" style={{ width: "100%", height: hoehe }}>
      <G stroke={color} fill="none" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
        {MUSTERSTREIFEN_PFADE.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </G>
    </Svg>
  );
}
