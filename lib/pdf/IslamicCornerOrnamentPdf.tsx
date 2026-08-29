import React from "react";
import { Svg, Path, G } from "@react-pdf/renderer";
import { ECKORNAMENT_VIEWBOX, ECKORNAMENT_PFADE, eckenTransform, Ecke } from "@/lib/cornerOrnament";

export function IslamicCornerOrnamentPdf({
  ecke,
  color = "#1a1a1a",
  size = 40,
}: {
  ecke: Ecke;
  color?: string;
  size?: number;
}) {
  const top = ecke === "oben-links" || ecke === "oben-rechts";
  const left = ecke === "oben-links" || ecke === "unten-links";

  return (
    <Svg
      viewBox={ECKORNAMENT_VIEWBOX}
      style={{
        position: "absolute",
        width: size,
        height: size,
        top: top ? 0 : undefined,
        bottom: top ? undefined : 0,
        left: left ? 0 : undefined,
        right: left ? undefined : 0,
      }}
    >
      <G
        stroke={color}
        fill="none"
        strokeWidth={0.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={eckenTransform(ecke) || undefined}
      >
        {ECKORNAMENT_PFADE.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </G>
    </Svg>
  );
}
