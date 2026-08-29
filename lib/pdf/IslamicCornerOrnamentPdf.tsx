import React from "react";
import path from "path";
import { Image } from "@react-pdf/renderer";
import { Ecke, EckFarbe, eckenTransform, ECKORNAMENT_SEITENVERHAELTNIS } from "@/lib/cornerOrnament";

function eckBildPfadPdf(farbe: EckFarbe): string {
  const datei = farbe === "hell" ? "ecke-hell.png" : "ecke-schwarz.png";
  return path.join(process.cwd(), `public/patterns/${datei}`);
}

export function IslamicCornerOrnamentPdf({
  ecke,
  farbe = "schwarz",
  size = 62,
}: {
  ecke: Ecke;
  farbe?: EckFarbe;
  size?: number;
}) {
  const top = ecke === "oben-links" || ecke === "oben-rechts";
  const left = ecke === "oben-links" || ecke === "unten-links";
  const hoehe = size / ECKORNAMENT_SEITENVERHAELTNIS;
  const transform = eckenTransform(ecke);

  return (
    <Image
      src={eckBildPfadPdf(farbe)}
      style={{
        position: "absolute",
        width: size,
        height: hoehe,
        top: top ? 0 : undefined,
        bottom: top ? undefined : 0,
        left: left ? 0 : undefined,
        right: left ? undefined : 0,
        transform: transform || undefined,
      }}
    />
  );
}
