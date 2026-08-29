import { useId } from "react";
import { MusterVariante } from "@/lib/types";
import { MUSTER_DEFINITIONEN } from "@/lib/patternStrip";

export default function IslamicPatternStrip({
  variante = "sterne",
  color = "#1a1a1a",
  hoehe = 28,
  opacity = 1,
  className,
}: {
  variante?: MusterVariante;
  color?: string;
  hoehe?: number;
  opacity?: number;
  className?: string;
}) {
  const patternId = `musterstreifen-kachel-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const definition = MUSTER_DEFINITIONEN[variante];
  const skalierung = hoehe / definition.kachelHoehe;
  const kachelBreitePx = definition.kachelBreite * skalierung;
  const [rahmenOben, rahmenUnten] = definition.rahmenY.map((y) => y * skalierung);

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
          viewBox={`0 0 ${definition.kachelBreite} ${definition.kachelHoehe}`}
        >
          <g fill="none" stroke={color} strokeLinejoin="round" strokeLinecap="round">
            {definition.gruppen.map((gruppe, gi) => (
              <g key={gi} strokeWidth={gruppe.strichstaerke}>
                {gruppe.pfade.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      <g stroke={color} strokeWidth={definition.rahmenStrichstaerke * skalierung}>
        <line x1="0" y1={rahmenOben} x2="100%" y2={rahmenOben} />
        <line x1="0" y1={rahmenUnten} x2="100%" y2={rahmenUnten} />
      </g>
    </svg>
  );
}
