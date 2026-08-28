"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteAllButton({ anzahl }: { anzahl: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function handleDeleteAll() {
    if (
      !window.confirm(
        `Wirklich alle ${anzahl} Arbeitsblätter unwiderruflich löschen? Das kann nicht rückgängig gemacht werden.`,
      )
    )
      return;

    setLoading(true);
    const res = await fetch("/api/worksheet", { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      startTransition(() => router.refresh());
    }
  }

  return (
    <button
      type="button"
      onClick={handleDeleteAll}
      disabled={isPending || loading}
      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-60"
    >
      <Trash2 size={14} />
      {loading ? "Wird gelöscht …" : "Alle löschen"}
    </button>
  );
}
