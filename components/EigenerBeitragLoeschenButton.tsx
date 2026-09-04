"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

const LOESCH_PFAD: Record<"thread" | "antwort", string> = {
  thread: "threads",
  antwort: "antworten",
};

/** Löscht das eigene Forum-Thema/die eigene Antwort (nur für die Autorin/den Autor selbst
 * gerendert, siehe app/forum/[id]/page.tsx) über den ownership-geprüften Pfad
 * /api/forum/threads|antworten/[id] - unterscheidet sich von
 * components/ForumInhaltLoeschenButton.tsx (Admin-Moderation gemeldeter Beiträge). */
export default function EigenerBeitragLoeschenButton({
  typ,
  id,
  nachLoeschenZu,
}: {
  typ: "thread" | "antwort";
  id: string;
  /** Ziel-URL nach dem Löschen - bei "thread" nötig, da die Detailseite danach nicht mehr
   * existiert. Bei "antwort" weglassen, dort reicht ein einfaches router.refresh(). */
  nachLoeschenZu?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function loeschen() {
    if (!window.confirm("Wirklich unwiderruflich löschen?")) return;

    const res = await fetch(`/api/forum/${LOESCH_PFAD[typ]}/${id}`, { method: "DELETE" });
    if (res.ok) {
      startTransition(() => {
        if (nachLoeschenZu) router.push(nachLoeschenZu);
        else router.refresh();
      });
    } else {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Löschen fehlgeschlagen.");
    }
  }

  return (
    <button
      type="button"
      onClick={loeschen}
      disabled={isPending}
      title="Löschen"
      aria-label="Löschen"
      className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-red-600 disabled:opacity-60"
    >
      <Trash2 size={12} /> Löschen
    </button>
  );
}
