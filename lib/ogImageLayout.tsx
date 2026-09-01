/** Gemeinsames Layout für die Social-Share-Vorschaubilder (siehe app/opengraph-image.tsx und
 * app/twitter-image.tsx) - wird von next/og's ImageResponse gerendert (Satori: JSX-Subset, jedes
 * Element mit Text-Kindern braucht ein explizites display:"flex"). Bewusst ein generisches,
 * markenkonsistentes Bild für ALLE Seiten (gleiche Optik wie das Logo im Header) statt
 * pro-Arbeitsblatt-Inhalt - Arbeitsblätter sind kontogebunden/privat, ein geteilter Link soll nie
 * Unterrichtsinhalte in der Linkvorschau preisgeben. */
export function OgImageLayout() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #12704c 0%, #0f5940 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 148,
          height: 148,
          borderRadius: 34,
          background: "rgba(255,255,255,0.14)",
          marginBottom: 44,
        }}
      >
        <svg width={82} height={82} viewBox="0 0 24 24">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="#f4ead1" />
        </svg>
      </div>
      <div style={{ display: "flex", fontSize: 66, fontWeight: 700, color: "#ffffff" }}>
        Lernwerk
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#dcf5e7", marginTop: 20 }}>
        Islamischer Religionsunterricht · Österreich
      </div>
    </div>
  );
}
