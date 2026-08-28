import { arabeskeRanke } from "@/lib/pattern";

const BREITE = 800;
const HOEHE = 40;

export default function IslamicPatternStrip({
  color = "#9c7a2c",
  opacity = 0.6,
  wellen = 4,
  zeigeWort = true,
  className,
}: {
  color?: string;
  opacity?: number;
  wellen?: number;
  /** Kalligrafie-Wortbild ("علم") mittig einblenden - für einzelne Zierstreifen sinnvoll,
   *  bei dicht wiederholten Dekor-Rändern (z.B. Hero-Banner) besser deaktivieren. */
  zeigeWort?: boolean;
  className?: string;
}) {
  const { stammPfad, blaetter } = arabeskeRanke(BREITE, HOEHE, wellen);
  return (
    <div className={`relative ${className ?? ""}`} style={{ height: HOEHE }}>
      <svg
        viewBox={`0 0 ${BREITE} ${HOEHE}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ width: "100%", height: HOEHE }}
      >
        <path d={stammPfad} fill="none" stroke={color} strokeWidth={0.9} opacity={opacity} />
        {blaetter.map((b, i) => (
          <path key={i} d={b.d} fill="none" stroke={color} strokeWidth={0.9} opacity={opacity} />
        ))}
      </svg>
      {zeigeWort && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/patterns/ilm-gold.png"
            alt=""
            aria-hidden="true"
            style={{ height: HOEHE * 0.8, width: "auto" }}
          />
        </span>
      )}
    </div>
  );
}
