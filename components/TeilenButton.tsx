"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Share2, Users } from "lucide-react";

/** Nur für die Besitzerin/den Besitzer eines Arbeitsblatts (Abo-Konto, siehe istZahlendesKonto) -
 * gibt das Arbeitsblatt sofort für andere Lehrkräfte frei bzw. zieht die Freigabe zurück (siehe
 * app/community, app/api/worksheet/[id]/teilen). */
export default function TeilenButton({
  worksheetId,
  initialGeteilt,
}: {
  worksheetId: string;
  initialGeteilt: boolean;
}) {
  const router = useRouter();
  const [geteilt, setGeteilt] = useState(initialGeteilt);
  const [isPending, startTransition] = useTransition();

  async function toggle() {
    const next = !geteilt;
    setGeteilt(next);
    try {
      const res = await fetch(`/api/worksheet/${worksheetId}/teilen`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geteilt: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setGeteilt(!next);
    }
  }

  if (geteilt) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        title="Freigabe zurückziehen"
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2 text-sm font-medium text-brand-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
      >
        <Users size={15} /> Geteilt
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      title="Mit anderen Abo-Konten teilen"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
    >
      <Share2 size={15} /> Arbeitsblatt teilen
    </button>
  );
}
