import { STATUS_FARBE, STATUS_LABEL, type NutzerStatus } from "@/lib/status";

/** Profilbild-Kreis mit optionalem Status-Punkt (siehe lib/status.ts) - EIN gemeinsames
 * Rendering für SiteHeader, ForumChat, Forum-Themen/Antworten und die Profilseite, damit
 * Avatar+Status überall gleich aussehen statt an jeder Stelle einzeln nachgebaut zu werden. */
export default function AvatarKreis({
  anzeige,
  farbe,
  textFarbe,
  status,
  size = 32,
}: {
  anzeige: string;
  farbe: string;
  textFarbe: string;
  /** Weglassen (kein Status bekannt, z.B. gelöschtes Konto) blendet den Punkt aus. */
  status?: NutzerStatus | null;
  size?: number;
}) {
  const punktGroesse = Math.max(8, Math.round(size * 0.32));
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className="flex h-full w-full items-center justify-center rounded-full border border-black/10 font-bold leading-none"
        style={{ backgroundColor: farbe, color: textFarbe, fontSize: Math.round(size * 0.34) }}
        dir="auto"
      >
        {anzeige}
      </span>
      {status && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-surface"
          style={{ width: punktGroesse, height: punktGroesse, backgroundColor: STATUS_FARBE[status] }}
          title={STATUS_LABEL[status]}
          aria-label={STATUS_LABEL[status]}
        />
      )}
    </span>
  );
}
