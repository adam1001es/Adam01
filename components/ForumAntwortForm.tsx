"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "@/lib/formStyles";
import { FORUM_INHALT_MAX_LAENGE } from "@/lib/forum";

export default function ForumAntwortForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [inhalt, setInhalt] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setIsPending(true);
    const res = await fetch(`/api/forum/threads/${threadId}/antworten`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inhalt }),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);
    if (!res.ok) {
      setFehler(data.error ?? "Antwort konnte nicht gesendet werden.");
      return;
    }
    setInhalt("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-slate-200 bg-surface p-4 shadow-card"
    >
      <textarea
        className={inputClass}
        value={inhalt}
        onChange={(e) => setInhalt(e.target.value)}
        maxLength={FORUM_INHALT_MAX_LAENGE}
        rows={4}
        placeholder="Deine Antwort…"
        required
      />
      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-forum-gradient px-4 py-2.5 text-sm font-medium text-white shadow-card-forum transition disabled:opacity-60"
      >
        {isPending ? "Wird gesendet…" : "Antworten"}
      </button>
    </form>
  );
}
