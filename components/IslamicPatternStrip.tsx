import { islamischerZierstreifen } from "@/lib/geometricPattern";

const BREITE = 800;
const HOEHE = 24;

export default function IslamicPatternStrip({
  color = "#9c7a2c",
  opacity = 1,
  className,
}: {
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const { linie, rauten } = islamischerZierstreifen(BREITE, HOEHE);
  const gradientId = `zierstreifen-verlauf-${color.replace("#", "")}`;

  return (
    <div className={className} style={{ height: HOEHE }}>
      <svg
        viewBox={`0 0 ${BREITE} ${HOEHE}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ width: "100%", height: HOEHE, opacity }}
      >
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={BREITE} y2={0}>
            <stop offset="0%" stopColor={color} stopOpacity={0} />
            <stop offset="50%" stopColor={color} stopOpacity={0.9} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <line {...linie} stroke={`url(#${gradientId})`} strokeWidth={1} />
        {rauten.map((d, i) => (
          <path key={i} d={d} fill={color} />
        ))}
      </svg>
    </div>
  );
}
