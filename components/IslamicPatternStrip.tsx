import { useId } from "react";
import {
  MUSTERSTREIFEN_KACHEL_BREITE,
  MUSTERSTREIFEN_KACHEL_HOEHE,
  MUSTERSTREIFEN_STERN_PFAD,
  MUSTERSTREIFEN_HEXAGON_PFAD,
  MUSTERSTREIFEN_RAHMEN_Y,
} from "@/lib/patternStrip";

export default function IslamicPatternStrip({
  color = "#1a1a1a",
  hoehe = 28,
  opacity = 1,
  className,
}: {
  color?: string;
  hoehe?: number;
  opacity?: number;
  className?: string;
}) {
  const patternId = `musterstreifen-kachel-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const skalierung = hoehe / MUSTERSTREIFEN_KACHEL_HOEHE;
  const kachelBreitePx = MUSTERSTREIFEN_KACHEL_BREITE * skalierung;
  const [rahmenO1, rahmenO2, rahmenU1, rahmenU2] = MUSTERSTREIFEN_RAHMEN_Y.map((y) => y * skalierung);

  return (
    <svg
      width="100%"
      height={hoehe}
      aria-hidden="true"
      className={className}
      style={{ display: "block", opacity }}
    >
      <defs>
        {/* Eine Kachel wird per patternUnits/viewBox beliebig oft nebeneinander wiederholt, bis
            die volle Breite gefüllt ist - ohne die Formen dabei zu verzerren. */}
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={kachelBreitePx}
          height={hoehe}
          viewBox={`0 0 ${MUSTERSTREIFEN_KACHEL_BREITE} ${MUSTERSTREIFEN_KACHEL_HOEHE}`}
        >
          <g stroke={color} fill="none" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round">
            <path d={MUSTERSTREIFEN_STERN_PFAD} />
            <path d={MUSTERSTREIFEN_HEXAGON_PFAD} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      <g stroke={color} strokeWidth={1.4}>
        <line x1="0" y1={rahmenO1} x2="100%" y2={rahmenO1} />
        <line x1="0" y1={rahmenO2} x2="100%" y2={rahmenO2} />
        <line x1="0" y1={rahmenU1} x2="100%" y2={rahmenU1} />
        <line x1="0" y1={rahmenU2} x2="100%" y2={rahmenU2} />
      </g>
    </svg>
  );
}
