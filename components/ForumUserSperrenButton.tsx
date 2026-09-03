"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";

/** Sperrt/entsperrt ein Konto fürs Forum (User.forumGesperrt) - Ausgangszustand wird per Prop
 * übergeben, da die Meldungsliste nicht pro Zeile den aktuellen Sperrstatus jedes gemeldeten
 * Kontos separat lädt (siehe app/admin/forum-meldungen). */
export default function ForumUserSperrenButton({
  userId,
  initialGesperrt,
}: {
  userId: string;
  initialGesperrt: boolean;
}) {
  const router = useRouter();
  const [gesperrt, setGesperrt] = useState(initialGesperrt);
  const [isPending, startTransition] = useTransition();

  async function umschalten() {
    const next = !gesperrt;
    if (next && !window.confirm("Dieses Konto wirklich für das Forum sperren?")) return;

    const vorher = gesperrt;
    setGesperrt(next);
    try {
      const res = await fetch(`/api/admin/users/${userId}/forum-sperre`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gesperrt: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setGesperrt(vorher);
    }
  }

  return (
    <button
      type="button"
      onClick={umschalten}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
        gesperrt
          ? "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
          : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
      }`}
    >
      <Ban size={12} /> {gesperrt ? "Forum-Sperre aufheben" : "Für Forum sperren"}
    </button>
  );
}
