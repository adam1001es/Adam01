"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass } from "@/lib/formStyles";
import type { JahresplanKalenderVariante } from "@/lib/jahresplanKalender";

/** Formular für eine neue Jahresplanung (siehe app/werkzeuge/jahresplanung/neu) - spiegelt die
 * freien Kopf-Felder der offiziellen Word-Vorlage (Gruppe/Erstellt von/Bemerkungen/Fokus), plus
 * die Wahl der Kalender-Variante (benannt nach dem tatsächlichen Schulbeginn-Termin der eigenen
 * Schule, nicht nach Bundesland). "varianten" kommt vom Server (app/werkzeuge/jahresplanung/neu)
 * statt direkt aus lib/jahresplanKalender.ts importiert zu werden - enthält so auch admin-
 * hochgeladene Varianten aus der Datenbank (siehe lib/jahresplanVarianten.ts), die eine
 * Client-Komponente nicht selbst per Prisma abfragen könnte. */
export default function JahresplanErstellenForm({
  varianten,
}: {
  varianten: JahresplanKalenderVariante[];
}) {
  const router = useRouter();
  const [variante, setVariante] = useState(varianten[0]?.id ?? "");
  const [gruppe, setGruppe] = useState("");
  const [erstelltVon, setErstelltVon] = useState("");
  const [bemerkungenGruppe, setBemerkungenGruppe] = useState("");
  const [speziellerFokus, setSpeziellerFokus] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setIsPending(true);
    const res = await fetch("/api/jahresplaene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variante,
        gruppe,
        erstelltVon: erstelltVon || null,
        bemerkungenGruppe: bemerkungenGruppe || null,
        speziellerFokus: speziellerFokus || null,
      }),
    });
    setIsPending(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/werkzeuge/jahresplanung/${data.jahresplan.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setFehler(data.error ?? "Anlegen fehlgeschlagen.");
    }
  }

  return (
    <form onSubmit={absenden} className="space-y-4 rounded-2xl border border-slate-200 bg-surface p-5 shadow-card">
      <label className="block">
        <span className={labelClass}>Schulbeginn-Termin deiner Schule</span>
        <select value={variante} onChange={(e) => setVariante(e.target.value)} className={inputClass}>
          {varianten.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} (Schuljahr {v.schuljahr})
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-400">
          Bestimmt Wochendatum, Hijri-Datum und Ferien - je nach Bundesland startet das Schuljahr an
          einem von zwei Terminen.
        </span>
      </label>

      <label className="block">
        <span className={labelClass}>Religionsunterrichtsgruppe</span>
        <input
          type="text"
          value={gruppe}
          onChange={(e) => setGruppe(e.target.value)}
          placeholder="z.B. 3a/3b VS Musterstraße"
          required
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Erstellt von (optional)</span>
        <input
          type="text"
          value={erstelltVon}
          onChange={(e) => setErstelltVon(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Bemerkungen zur Gruppe (optional)</span>
        <textarea
          value={bemerkungenGruppe}
          onChange={(e) => setBemerkungenGruppe(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Spezieller Fokus (optional)</span>
        <textarea
          value={speziellerFokus}
          onChange={(e) => setSpeziellerFokus(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </label>

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-werkzeuge-gradient px-5 py-2.5 text-sm font-medium text-white shadow-card-werkzeuge disabled:opacity-60"
      >
        {isPending ? "Wird angelegt…" : "Jahresplanung anlegen"}
      </button>
    </form>
  );
}
