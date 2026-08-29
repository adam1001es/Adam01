import { MusterFarbe, musterstreifenPfadWeb, MUSTERSTREIFEN_SEITENVERHAELTNIS } from "@/lib/patternStrip";

export default function IslamicPatternStrip({
  farbe = "schwarz",
  hoehe = 64,
  opacity = 1,
  className,
}: {
  farbe?: MusterFarbe;
  hoehe?: number;
  opacity?: number;
  className?: string;
}) {
  const breite = Math.round(hoehe * MUSTERSTREIFEN_SEITENVERHAELTNIS);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={musterstreifenPfadWeb(farbe)}
      alt=""
      aria-hidden="true"
      width={breite}
      height={hoehe}
      className={className}
      style={{ display: "block", width: breite, height: hoehe, opacity }}
    />
  );
}
