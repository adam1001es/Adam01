import { musterStreifen } from "@/lib/pattern";

const BREITE = 800;
const HOEHE = 20;

export default function IslamicPatternStrip({
  color = "#0f9d58",
  opacity = 0.3,
  anzahl = 18,
  className,
}: {
  color?: string;
  opacity?: number;
  anzahl?: number;
  className?: string;
}) {
  const sterne = musterStreifen(BREITE, HOEHE, anzahl);
  return (
    <svg
      viewBox={`0 0 ${BREITE} ${HOEHE}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: HOEHE }}
    >
      {sterne.map((s, i) => (
        <polygon key={i} points={s.points} fill={color} opacity={opacity} />
      ))}
    </svg>
  );
}
