"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass } from "@/lib/formStyles";
import {
  FORUM_KATEGORIEN,
  FORUM_KATEGORIE_LABEL,
  FORUM_TITEL_MAX_LAENGE,
  FORUM_INHALT_MAX_LAENGE,
} from "@/lib/forum";

export default function ForumNeuesThemaForm() {
  const router = useRouter();
  const [titel, setTitel] = useState("");
  const [kategorie, setKategorie] = useState<(typeof FORUM_KATEGORIEN)[number]>(
    FORUM_KATEGORIEN[0],
  );
  const [inhalt, setInhalt] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setIsPending(true);
    const res = await fetch("/api/forum/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titel, kategorie, inhalt }),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);
    if (!res.ok) {
      setFehler(data.error ?? "Thema konnte nicht angelegt werden.");
      return;
    }
    router.push(`/forum/${data.id}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-surface p-5 shadow-card sm:p-6"
    >
      <label className="block">
        <span className={labelClass}>Titel</span>
        <input
          className={inputClass}
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          maxLength={FORUM_TITEL_MAX_LAENGE}
          placeholder="Worum geht's?"
          required
          autoFocus
        />
      </label>
      <label className="block">
        <span className={labelClass}>Kategorie</span>
        <select
          className={inputClass}
          value={kategorie}
          onChange={(e) => setKategorie(e.target.value as (typeof FORUM_KATEGORIEN)[number])}
        >
          {FORUM_KATEGORIEN.map((k) => (
            <option key={k} value={k}>
              {FORUM_KATEGORIE_LABEL[k]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>Text</span>
        <textarea
          className={inputClass}
          value={inhalt}
          onChange={(e) => setInhalt(e.target.value)}
          maxLength={FORUM_INHALT_MAX_LAENGE}
          rows={8}
          placeholder="Schreib, was du teilen oder fragen möchtest…"
          required
        />
      </label>
      {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-forum-gradient px-5 py-2.5 text-sm font-medium text-white shadow-card-forum transition disabled:opacity-60"
      >
        {isPending ? "Wird angelegt…" : "Thema veröffentlichen"}
      </button>
    </form>
  );
}
