"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ForumMeldungZielTyp } from "@/lib/forum";

const LOESCH_PFAD: Record<ForumMeldungZielTyp, string> = {
  thread: "threads",
  antwort: "antworten",
  chat: "chat",
};

/** Löscht den gemeldeten Forum-Beitrag (Thema/Antwort/Chat-Nachricht) - die ForumMeldung selbst
 * bleibt als Nachweis bestehen (lose zielId-Referenz, siehe Kommentar am ForumMeldung-Modell). */
export default function ForumInhaltLoeschenButton({
  zielTyp,
  zielId,
}: {
  zielTyp: ForumMeldungZielTyp;
  zielId: string;
}) {
  const router = useRouter();
  const [geloescht, setGeloescht] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function loeschen() {
    if (!window.confirm("Diesen Beitrag wirklich unwiderruflich löschen?")) return;

    const res = await fetch(`/api/admin/forum/${LOESCH_PFAD[zielTyp]}/${zielId}`, {
      method: "DELETE",
    });
    if (res.ok || res.status === 404) {
      setGeloescht(true);
      startTransition(() => router.refresh());
    } else {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Löschen fehlgeschlagen.");
    }
  }

  if (geloescht) {
    return <span className="text-xs text-slate-400">Gelöscht</span>;
  }

  return (
    <button
      type="button"
      onClick={loeschen}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
    >
      <Trash2 size={12} /> Beitrag löschen
    </button>
  );
}
