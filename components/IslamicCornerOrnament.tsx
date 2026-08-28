import {
  ECKORNAMENT_VIEWBOX,
  ECKORNAMENT_AUSSEN,
  ECKORNAMENT_INNEN,
  ECKORNAMENT_QUADRATE,
  eckenTransform,
  Ecke,
} from "@/lib/cornerOrnament";

export default function IslamicCornerOrnament({
  ecke,
  color = "#9c7a2c",
  size = 40,
  className,
}: {
  ecke: Ecke;
  color?: string;
  size?: number;
  className?: string;
}) {
  const top = ecke === "oben-links" || ecke === "oben-rechts";
  const left = ecke === "oben-links" || ecke === "unten-links";

  return (
    <svg
      width={size}
      height={size}
      viewBox={ECKORNAMENT_VIEWBOX}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        top: top ? 0 : undefined,
        bottom: top ? undefined : 0,
        left: left ? 0 : undefined,
        right: left ? undefined : 0,
      }}
    >
      <g
        stroke={color}
        fill="none"
        strokeWidth={2}
        strokeLinecap="square"
        strokeLinejoin="miter"
        transform={eckenTransform(ecke) || undefined}
      >
        <path d={ECKORNAMENT_AUSSEN} />
        <path d={ECKORNAMENT_INNEN} />
        {ECKORNAMENT_QUADRATE.map((q, i) => (
          <rect
            key={i}
            x={q.cx - q.groesse / 2}
            y={q.cy - q.groesse / 2}
            width={q.groesse}
            height={q.groesse}
            stroke="none"
            fill={color}
          />
        ))}
      </g>
    </svg>
  );
}
