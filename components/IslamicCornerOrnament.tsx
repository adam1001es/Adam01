import { ECKORNAMENT_VIEWBOX, ECKORNAMENT_PFADE, eckenTransform, Ecke } from "@/lib/cornerOrnament";

export default function IslamicCornerOrnament({
  ecke,
  color = "#1a1a1a",
  size = 64,
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
        strokeWidth={0.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={eckenTransform(ecke) || undefined}
      >
        {ECKORNAMENT_PFADE.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
