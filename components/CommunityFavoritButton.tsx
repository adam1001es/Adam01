"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Wie FavoritButton, aber für ein FREMDES, geteiltes Arbeitsblatt in der Community-Übersicht
 * (app/community) - eigenes Modell im Hintergrund (CommunityFavorit statt Worksheet.favorit),
 * da hier mehrere fremde Konten unabhängig voneinander favorisieren können müssen. */
export default function CommunityFavoritButton({
  worksheetId,
  initialFavorit,
}: {
  worksheetId: string;
  initialFavorit: boolean;
}) {
  const router = useRouter();
  const [favorit, setFavorit] = useState(initialFavorit);
  const [isPending, startTransition] = useTransition();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorit;
    setFavorit(next);
    try {
      const res = await fetch(`/api/worksheet/${worksheetId}/community-favorit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorit: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setFavorit(!next);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      title={favorit ? "Aus Favoriten entfernen" : "Als Favorit markieren"}
      aria-label={favorit ? "Aus Favoriten entfernen" : "Als Favorit markieren"}
      className={`rounded-full p-1.5 text-lg leading-none transition hover:bg-amber-50 ${
        favorit ? "text-amber-500" : "text-slate-300 hover:text-amber-400"
      }`}
    >
      {favorit ? "★" : "☆"}
    </button>
  );
}
