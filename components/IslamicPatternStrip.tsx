import { useId } from "react";
import {
  MUSTERSTREIFEN_KACHEL_BREITE,
  MUSTERSTREIFEN_KACHEL_HOEHE,
  MUSTERSTREIFEN_RAHMEN_Y,
  MUSTERSTREIFEN_RAHMEN_STRICHSTAERKE,
  MUSTERSTREIFEN_HAUPT_PFADE,
  MUSTERSTREIFEN_HAUPT_STRICHSTAERKE,
  MUSTERSTREIFEN_INNEN_PFADE,
  MUSTERSTREIFEN_INNEN_STRICHSTAERKE,
  MUSTERSTREIFEN_FEIN_PFADE,
  MUSTERSTREIFEN_FEIN_STRICHSTAERKE,
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
  const [rahmenOben, rahmenUnten] = MUSTERSTREIFEN_RAHMEN_Y.map((y) => y * skalierung);

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
          <g fill="none" stroke={color} strokeLinejoin="miter" strokeLinecap="round">
            <g strokeWidth={MUSTERSTREIFEN_HAUPT_STRICHSTAERKE}>
              {MUSTERSTREIFEN_HAUPT_PFADE.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g strokeWidth={MUSTERSTREIFEN_INNEN_STRICHSTAERKE}>
              {MUSTERSTREIFEN_INNEN_PFADE.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g strokeWidth={MUSTERSTREIFEN_FEIN_STRICHSTAERKE}>
              {MUSTERSTREIFEN_FEIN_PFADE.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      <g stroke={color} strokeWidth={MUSTERSTREIFEN_RAHMEN_STRICHSTAERKE * skalierung}>
        <line x1="0" y1={rahmenOben} x2="100%" y2={rahmenOben} />
        <line x1="0" y1={rahmenUnten} x2="100%" y2={rahmenUnten} />
      </g>
    </svg>
  );
}
