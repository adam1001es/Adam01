const HOEHE = 40;

export default function IslamicPatternStrip({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${className ?? ""}`} style={{ height: HOEHE }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/patterns/lernen-gold.png"
        alt=""
        aria-hidden="true"
        style={{ height: HOEHE * 0.9, width: "auto" }}
      />
    </div>
  );
}
