import { islamischesSternband } from "@/lib/geometricPattern";

const BREITE = 800;
const HOEHE = 32;

export default function IslamicPatternStrip({
  color = "#9c7a2c",
  opacity = 1,
  anzahl = 8,
  className,
}: {
  color?: string;
  opacity?: number;
  anzahl?: number;
  className?: string;
}) {
  const { linie, sterne, rauten } = islamischesSternband(BREITE, HOEHE, anzahl);
  return (
    <div className={className} style={{ height: HOEHE }}>
      <svg
        viewBox={`0 0 ${BREITE} ${HOEHE}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ width: "100%", height: HOEHE, opacity }}
      >
        <line {...linie} stroke={color} strokeWidth={0.5} opacity={0.4} />
        {sterne.map((d, i) => (
          <path key={i} d={d} fill="#fdfbf5" stroke={color} strokeWidth={1.1} />
        ))}
        {rauten.map((d, i) => (
          <path key={i} d={d} fill={color} opacity={0.65} />
        ))}
      </svg>
    </div>
  );
}
