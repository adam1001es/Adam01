"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Umschaltet das vom Admin gesetzte "bearbeitet"-Flag - unabhängig vom automatischen
 * Analyse-Ergebnis (status), das nur die KI-Diagnose festhält (siehe lib/meldungFix.ts). */
export default function MeldungStatusButton({
  meldungId,
  initialBearbeitet,
}: {
  meldungId: string;
  initialBearbeitet: boolean;
}) {
  const router = useRouter();
  const [bearbeitet, setBearbeitet] = useState(initialBearbeitet);
  const [isPending, startTransition] = useTransition();

  async function umschalten() {
    const next = !bearbeitet;
    const vorher = bearbeitet;
    setBearbeitet(next);
    try {
      const res = await fetch(`/api/admin/meldungen/${meldungId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bearbeitet: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setBearbeitet(vorher);
    }
  }

  return (
    <button
      type="button"
      onClick={umschalten}
      disabled={isPending}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
        !bearbeitet
          ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
      }`}
    >
      {!bearbeitet ? "Als gesichtet markieren" : "Erledigt – wieder öffnen"}
    </button>
  );
}
