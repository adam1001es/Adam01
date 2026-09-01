"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

/** Generischer Lösch-Button für die Klassen-Seiten (Klasse/Schüler:in/Zuweisung) - im
 * Unterschied zu components/DeleteButton.tsx (fest auf /api/worksheet/[id] verdrahtet) nimmt
 * dieser die URL als Prop, da es hier mehrere unterschiedliche Lösch-Endpunkte gibt. */
export default function EinfacherLoeschButton({
  url,
  bestaetigung,
  redirectTo,
  variant = "icon",
}: {
  url: string;
  bestaetigung: string;
  redirectTo?: string;
  variant?: "icon" | "button";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(bestaetigung)) return;
    setFehler(null);
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      startTransition(() => {
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setFehler(data.error ?? "Löschen fehlgeschlagen.");
    }
  }

  if (variant === "button") {
    return (
      <div className="inline-block">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-red-300 hover:text-red-600"
        >
          <Trash2 size={15} /> Löschen
        </button>
        {fehler && <p className="mt-1 text-xs text-red-600">{fehler}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      title="Löschen"
      aria-label="Löschen"
      className="rounded-full p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
    >
      <Trash2 size={16} />
    </button>
  );
}
