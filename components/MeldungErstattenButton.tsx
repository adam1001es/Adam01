"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Undo2, CheckCircle2 } from "lucide-react";

export default function MeldungErstattenButton({
  meldungId,
  initialErstattet,
}: {
  meldungId: string;
  initialErstattet: boolean;
}) {
  const router = useRouter();
  const [erstattet, setErstattet] = useState(initialErstattet);
  const [senden, setSenden] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function erstatten() {
    setSenden(true);
    try {
      const res = await fetch(`/api/admin/meldungen/${meldungId}/erstatten`, { method: "POST" });
      if (!res.ok) throw new Error();
      setErstattet(true);
      startTransition(() => router.refresh());
    } catch {
      // Fehler bewusst still - der Button bleibt anklickbar, Admin kann es erneut versuchen.
    } finally {
      setSenden(false);
    }
  }

  if (erstattet) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
        <CheckCircle2 size={13} /> Kontingent erstattet
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={erstatten}
      disabled={senden || isPending}
      title="Arbeitsblatt zählt nicht mehr gegen das Kontingent der Lehrkraft"
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
    >
      <Undo2 size={13} /> Kontingent erstatten
    </button>
  );
}
