import React from "react";
import path from "path";
import { Svg, Path, View, Image } from "@react-pdf/renderer";
import { arabeskeRanke } from "@/lib/pattern";

const BREITE = 500;
const HOEHE = 26;

const WORT_BILD_PFAD = path.join(process.cwd(), "public/patterns/ilm-gold.png");

export function IslamicPatternStripPdf({
  color = "#9c7a2c",
  opacity = 0.6,
  wellen = 4,
}: {
  color?: string;
  opacity?: number;
  wellen?: number;
}) {
  const { stammPfad, blaetter } = arabeskeRanke(BREITE, HOEHE, wellen);
  const wortHoehe = HOEHE * 0.85;
  const wortBreite = wortHoehe * 1.45;

  return (
    <View
      style={{
        position: "relative",
        width: "100%",
        height: HOEHE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        viewBox={`0 0 ${BREITE} ${HOEHE}`}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: HOEHE }}
      >
        <Path d={stammPfad} fill="none" stroke={color} strokeWidth={0.6} opacity={opacity} />
        {blaetter.map((b, i) => (
          <Path key={i} d={b.d} fill="none" stroke={color} strokeWidth={0.6} opacity={opacity} />
        ))}
      </Svg>
      <View
        style={{
          backgroundColor: "#ffffff",
          paddingLeft: 6,
          paddingRight: 6,
          borderRadius: 8,
        }}
      >
        <Image src={WORT_BILD_PFAD} style={{ width: wortBreite, height: wortHoehe }} />
      </View>
    </View>
  );
}
