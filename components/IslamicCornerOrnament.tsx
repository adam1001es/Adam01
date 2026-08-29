import { Ecke, EckFarbe, eckBildPfadWeb, eckenTransform, ECKORNAMENT_SEITENVERHAELTNIS } from "@/lib/cornerOrnament";

export default function IslamicCornerOrnament({
  ecke,
  farbe = "schwarz",
  size = 92,
  className,
}: {
  ecke: Ecke;
  farbe?: EckFarbe;
  size?: number;
  className?: string;
}) {
  const top = ecke === "oben-links" || ecke === "oben-rechts";
  const left = ecke === "oben-links" || ecke === "unten-links";
  const hoehe = Math.round(size / ECKORNAMENT_SEITENVERHAELTNIS);
  const transform = eckenTransform(ecke);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={eckBildPfadWeb(farbe)}
      alt=""
      aria-hidden="true"
      width={size}
      height={hoehe}
      className={className}
      style={{
        position: "absolute",
        top: top ? 0 : undefined,
        bottom: top ? undefined : 0,
        left: left ? 0 : undefined,
        right: left ? undefined : 0,
        width: size,
        height: hoehe,
        transform: transform || undefined,
      }}
    />
  );
}
