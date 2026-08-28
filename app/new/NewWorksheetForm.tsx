"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AUFGABEN_TYPEN, TEMPLATES } from "@/lib/types";
import { THEMENBEREICHE, THEMENBEREICH_KEYS, ThemenbereichKey, SCHULSTUFEN_CLUSTER } from "@/lib/curriculum";

const TYP_LABEL: Record<(typeof AUFGABEN_TYPEN)[number], string> = {
  multiple_choice: "Multiple Choice",
  lueckentext: "Lückentext",
  zuordnung: "Zuordnung",
  offene_frage: "Offene Frage",
  wahr_falsch: "Wahr oder Falsch",
};

const TEMPLATE_LABEL: Record<(typeof TEMPLATES)[number], string> = {
  klassisch: "Klassisch (schlicht, seriös)",
  modern: "Modern (farbiger Kopfbereich)",
  kompakt: "Kompakt (platzsparend)",
};

export default function NewWorksheetForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bereich, setBereich] = useState("Islamischer Religionsunterricht");
  const [thema, setThema] = useState("");
  const [schulstufe, setSchulstufe] = useState("4. Klasse Volksschule");
  const [anzahlAufgaben, setAnzahlAufgaben] = useState(6);
  const [aufgabentypen, setAufgabentypen] = useState<string[]>([
    "multiple_choice",
    "lueckentext",
    "offene_frage",
  ]);
  const [zusatzhinweise, setZusatzhinweise] = useState("");
  const [themenbereich, setThemenbereich] = useState<ThemenbereichKey>("gemischt");

  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]>("klassisch");
  const [schulname, setSchulname] = useState("");
  const [loesungenSeparat, setLoesungenSeparat] = useState(true);
  const [schriftgroesse, setSchriftgroesse] = useState<"normal" | "gross">("normal");
  const [zeigeIslamischesDatum, setZeigeIslamischesDatum] = useState(true);
  const [zeigeMuster, setZeigeMuster] = useState(true);
  const [zeigeLernziel, setZeigeLernziel] = useState(true);

  function toggleTyp(typ: string) {
    setAufgabentypen((prev) =>
      prev.includes(typ) ? prev.filter((t) => t !== typ) : [...prev, typ],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (aufgabentypen.length === 0) {
      setError("Bitte mindestens einen Aufgabentyp auswählen.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bereich,
          thema,
          schulstufe,
          themenbereich,
          anzahlAufgaben,
          aufgabentypen,
          zusatzhinweise: zusatzhinweise || undefined,
          layout: {
            template,
            schulname: schulname || undefined,
            loesungenSeparat,
            schriftgroesse,
            zeigeIslamischesDatum,
            zeigeMuster,
            zeigeLernziel,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Generierung fehlgeschlagen.");
      }
      router.push(`/worksheet/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Inhalt</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Bereich / Fach</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={bereich}
              onChange={(e) => setBereich(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Schulstufe</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={schulstufe}
              onChange={(e) => setSchulstufe(e.target.value)}
              placeholder="z.B. 4. Klasse Volksschule"
              list="schulstufen-vorschlaege"
              required
            />
            <datalist id="schulstufen-vorschlaege">
              {SCHULSTUFEN_CLUSTER.map((c) => (
                <option key={c.id} value={c.label} />
              ))}
            </datalist>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">Themenbereich (laut Lehrplan)</span>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={themenbereich}
            onChange={(e) => setThemenbereich(e.target.value as ThemenbereichKey)}
          >
            {THEMENBEREICH_KEYS.map((key) => (
              <option key={key} value={key}>
                {THEMENBEREICHE[key].label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            {THEMENBEREICHE[themenbereich].beschreibung}
          </span>
        </label>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">Thema</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={thema}
            onChange={(e) => setThema(e.target.value)}
            placeholder="z.B. Die 5 Säulen des Islam"
            required
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">Zusätzliche Hinweise (optional)</span>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            rows={2}
            value={zusatzhinweise}
            onChange={(e) => setZusatzhinweise(e.target.value)}
            placeholder="z.B. Bezug zum Ramadan herstellen, einfache Sprache"
          />
        </label>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Aufgaben</h2>
        <label className="mb-4 block max-w-xs">
          <span className="mb-1 block text-sm font-medium">Anzahl Aufgaben</span>
          <input
            type="number"
            min={1}
            max={15}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={anzahlAufgaben}
            onChange={(e) => setAnzahlAufgaben(Number(e.target.value))}
          />
        </label>
        <span className="mb-1 block text-sm font-medium">Aufgabentypen</span>
        <div className="flex flex-wrap gap-2">
          {AUFGABEN_TYPEN.map((typ) => (
            <button
              type="button"
              key={typ}
              onClick={() => toggleTyp(typ)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                aufgabentypen.includes(typ)
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              {TYP_LABEL[typ]}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Layout</h2>
        <span className="mb-1 block text-sm font-medium">Vorlage</span>
        <div className="mb-4 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTemplate(t)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                template === t
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              {TEMPLATE_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Schulname (optional, im Kopf)</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={schulname}
              onChange={(e) => setSchulname(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Schriftgröße</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={schriftgroesse}
              onChange={(e) => setSchriftgroesse(e.target.value as "normal" | "gross")}
            >
              <option value="normal">Normal</option>
              <option value="gross">Groß</option>
            </select>
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={loesungenSeparat}
            onChange={(e) => setLoesungenSeparat(e.target.checked)}
          />
          Lösungen auf separatem Blatt/Seite ausgeben
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={zeigeIslamischesDatum}
            onChange={(e) => setZeigeIslamischesDatum(e.target.checked)}
          />
          Islamisches Datum (Hijri) neben dem gregorianischen Datum anzeigen
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={zeigeMuster}
            onChange={(e) => setZeigeMuster(e.target.checked)}
          />
          Dezentes islamisches Ornament-Muster im Kopfbereich anzeigen
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={zeigeLernziel}
            onChange={(e) => setZeigeLernziel(e.target.checked)}
          />
          Lernziel-Abschnitt auf dem Arbeitsblatt anzeigen
        </label>
      </section>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Wird erstellt und geprüft …" : "Arbeitsblatt erstellen"}
      </button>
    </form>
  );
}
