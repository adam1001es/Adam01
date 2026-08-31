"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function MeldungStatusButton({
  meldungId,
  initialStatus,
}: {
  meldungId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  async function umschalten() {
    const next = status === "offen" ? "bearbeitet" : "offen";
    const vorher = status;
    setStatus(next);
    try {
      const res = await fetch(`/api/admin/meldungen/${meldungId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setStatus(vorher);
    }
  }

  return (
    <button
      type="button"
      onClick={umschalten}
      disabled={isPending}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
        status === "offen"
          ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
      }`}
    >
      {status === "offen" ? "Als bearbeitet markieren" : "Erledigt – wieder öffnen"}
    </button>
  );
}
