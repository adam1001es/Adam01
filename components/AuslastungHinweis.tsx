import { Users } from "lucide-react";

/** Dezenter Hinweis, wenn gerade viele Kolleg:innen gleichzeitig eine KI-Anfrage laufen haben
 * (siehe lib/auslastung.ts) - rein informativ, blockiert das Erstellen nicht. */
export default function AuslastungHinweis({ aktiv }: { aktiv: number }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50 p-3.5 text-sm text-gold-800 shadow-sm">
      <Users size={16} className="mt-0.5 shrink-0" />
      <p>
        Gerade nutzen ungewöhnlich viele Kolleg:innen ({aktiv}) gleichzeitig die KI-Erstellung -
        deine Anfrage kann dadurch etwas länger dauern als sonst.
      </p>
    </div>
  );
}
