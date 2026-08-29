import { MUSTERSTREIFEN_VIEWBOX, MUSTERSTREIFEN_PFADE } from "@/lib/patternStrip";

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
  return (
    <svg
      viewBox={MUSTERSTREIFEN_VIEWBOX}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: hoehe, opacity }}
    >
      <g stroke={color} fill="none" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
        {MUSTERSTREIFEN_PFADE.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
