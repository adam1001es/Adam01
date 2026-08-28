import React from "react";
import { Svg, Path, Rect, Defs, LinearGradient, Stop, View } from "@react-pdf/renderer";
import { islamischerZierstreifen } from "@/lib/geometricPattern";

const BREITE = 500;
const HOEHE = 16;

export function IslamicPatternStripPdf({ color = "#9c7a2c" }: { color?: string }) {
  const { linie, rauten } = islamischerZierstreifen(BREITE, HOEHE);
  const gradientId = `zierstreifen-verlauf-${color.replace("#", "")}`;
  const stegHoehe = 0.75;

  return (
    <View style={{ width: "100%", height: HOEHE }}>
      <Svg viewBox={`0 0 ${BREITE} ${HOEHE}`} style={{ width: "100%", height: HOEHE }}>
        <Defs>
          <LinearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={BREITE} y2={0}>
            <Stop offset={0} stopColor={color} stopOpacity={0} />
            <Stop offset={0.5} stopColor={color} stopOpacity={0.9} />
            <Stop offset={1} stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={linie.y1 - stegHoehe / 2}
          width={BREITE}
          height={stegHoehe}
          fill={`url(#${gradientId})`}
        />
        {rauten.map((d, i) => (
          <Path key={i} d={d} fill={color} />
        ))}
      </Svg>
    </View>
  );
}
