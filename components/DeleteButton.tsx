"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteButton({
  worksheetId,
  titel,
  redirectTo,
  variant = "icon",
}: {
  worksheetId: string;
  titel: string;
  /** Nach dem Löschen dorthin navigieren, statt nur die aktuelle Seite zu aktualisieren
   *  (z.B. von der Detailseite eines gelöschten Arbeitsblatts zurück zur Übersicht). */
  redirectTo?: string;
  /** "icon": schlichtes Papierkorb-Icon (z.B. in Listenzeilen). "button": beschrifteter
   *  Button passend zu den übrigen Aktions-Buttons (z.B. auf der Detailseite). */
  variant?: "icon" | "button";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`„${titel}" wirklich unwiderruflich löschen?`)) return;

    const res = await fetch(`/api/worksheet/${worksheetId}`, { method: "DELETE" });
    if (res.ok) {
      startTransition(() => {
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      });
    }
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-red-300 hover:text-red-600"
      >
        <Trash2 size={15} /> Löschen
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      title="Arbeitsblatt löschen"
      aria-label="Arbeitsblatt löschen"
      className="rounded-full p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
    >
      <Trash2 size={16} />
    </button>
  );
}
