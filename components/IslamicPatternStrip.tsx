import { girihFaden } from "@/lib/pattern";

const BREITE = 800;
const HOEHE = 22;

export default function IslamicPatternStrip({
  color = "#9c7a2c",
  opacity = 0.55,
  anzahl = 11,
  className,
}: {
  color?: string;
  opacity?: number;
  anzahl?: number;
  className?: string;
}) {
  const { sterne, fadenY } = girihFaden(BREITE, HOEHE, anzahl);
  return (
    <svg
      viewBox={`0 0 ${BREITE} ${HOEHE}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: HOEHE }}
    >
      <line x1={0} y1={fadenY} x2={BREITE} y2={fadenY} stroke={color} strokeWidth={0.75} opacity={opacity} />
      {sterne.map((s, i) => (
        <polygon
          key={i}
          points={s.points}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={opacity}
        />
      ))}
    </svg>
  );
}
