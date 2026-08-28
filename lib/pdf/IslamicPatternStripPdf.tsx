import React from "react";
import path from "path";
import { View, Image } from "@react-pdf/renderer";

const HOEHE = 26;
const WORT_SEITENVERHAELTNIS = 556 / 452;

const WORT_BILD_PFAD = path.join(process.cwd(), "public/patterns/lernen-gold.png");

export function IslamicPatternStripPdf() {
  const wortHoehe = HOEHE * 0.95;
  const wortBreite = wortHoehe * WORT_SEITENVERHAELTNIS;

  return (
    <View
      style={{
        width: "100%",
        height: HOEHE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image src={WORT_BILD_PFAD} style={{ width: wortBreite, height: wortHoehe }} />
    </View>
  );
}
