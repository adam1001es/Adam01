import React from "react";
import path from "path";
import { Image } from "@react-pdf/renderer";
import { MusterFarbe, MUSTERSTREIFEN_SEITENVERHAELTNIS } from "@/lib/patternStrip";

function musterstreifenPfadPdf(farbe: MusterFarbe): string {
  const datei = farbe === "hell" ? "leiste-hell.png" : "leiste-schwarz.png";
  return path.join(process.cwd(), `public/patterns/${datei}`);
}

export function IslamicPatternStripPdf({
  farbe = "schwarz",
  hoehe = 42,
}: {
  farbe?: MusterFarbe;
  hoehe?: number;
}) {
  const breite = hoehe * MUSTERSTREIFEN_SEITENVERHAELTNIS;
  return <Image src={musterstreifenPfadPdf(farbe)} style={{ width: breite, height: hoehe, alignSelf: "center" }} />;
}
