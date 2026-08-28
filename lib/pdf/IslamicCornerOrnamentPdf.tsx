import React from "react";
import { Svg, Path, G } from "@react-pdf/renderer";
import {
  ECKORNAMENT_VIEWBOX,
  ECKORNAMENT_AUSSEN,
  ECKORNAMENT_INNEN,
  eckenTransform,
  Ecke,
} from "@/lib/cornerOrnament";

export function IslamicCornerOrnamentPdf({
  ecke,
  color = "#9c7a2c",
  size = 24,
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
        strokeWidth={2}
        strokeLinecap="square"
        strokeLinejoin="miter"
        transform={eckenTransform(ecke) || undefined}
      >
        <Path d={ECKORNAMENT_AUSSEN} />
        <Path d={ECKORNAMENT_INNEN} />
      </G>
    </Svg>
  );
}
