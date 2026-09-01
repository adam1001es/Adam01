"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { inputClass, labelClass } from "@/lib/formStyles";
import { SCHULSTUFEN_OPTIONEN } from "@/lib/curriculum";

export default function NeueKlasseForm() {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [name, setName] = useState("");
  const [schulstufe, setSchulstufe] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setIsPending(true);
    const res = await fetch("/api/klassen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, schulstufe: schulstufe || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);
    if (!res.ok) {
      setFehler(data.error ?? "Klasse konnte nicht angelegt werden.");
      return;
    }
    router.push(`/klassen/${data.id}`);
  }

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-card transition hover:bg-gold-50"
      >
        <Plus size={17} strokeWidth={2.5} />
        Neue Klasse anlegen
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
    >
      <label className="block">
        <span className={labelClass}>Name</span>
        <input
          className={`${inputClass} w-40`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. 7A"
          required
          autoFocus
        />
      </label>
      <label className="block">
        <span className={labelClass}>Schulstufe (optional)</span>
        <select
          className={`${inputClass} w-64`}
          value={schulstufe}
          onChange={(e) => setSchulstufe(e.target.value)}
        >
          <option value="">Keine Angabe</option>
          {SCHULSTUFEN_OPTIONEN.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-medium text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
      >
        {isPending ? "…" : "Anlegen"}
      </button>
      <button
        type="button"
        onClick={() => setOffen(false)}
        className="text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        Abbrechen
      </button>
      {fehler && <p className="w-full text-xs text-red-600">{fehler}</p>}
    </form>
  );
}
