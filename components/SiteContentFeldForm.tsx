"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Upload } from "lucide-react";
import { inputClass, labelClass } from "@/lib/formStyles";
import { SITE_CONTENT_MAX_LAENGE, type SiteContentFeld } from "@/lib/siteContent";

/** Ein Formular je registrierter Stelle (siehe lib/siteContent.ts SITE_CONTENT_FELDER) im
 * Admin-Bearbeitungspanel (app/admin/inhalte) - Eingabefeld je nach feld.typ (Text/Textarea/
 * Bild-Upload), "Speichern" mit Sicherheits-Rückfrage (window.confirm, wie überall sonst im
 * Admin-Bereich, siehe z.B. AdminDeleteUserButton) UND "Auf Standard zurücksetzen", ebenfalls mit
 * Rückfrage, da beides sofort auf der echten, öffentlichen Seite sichtbar wird. */
export default function SiteContentFeldForm({
  feld,
  initialValue,
  initialIstOverride,
}: {
  feld: SiteContentFeld;
  initialValue: string;
  /** Ob initialValue ein Admin-Override ist (echte DB-Zeile) oder der Code-Standard - steuert nur,
   * ob "Auf Standard zurücksetzen" überhaupt angezeigt wird. */
  initialIstOverride: boolean;
}) {
  const router = useRouter();
  const [wert, setWert] = useState(initialValue);
  const [istOverride, setIstOverride] = useState(initialIstOverride);
  const [isPending, setIsPending] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const geaendert = wert !== initialValue;

  async function speichern() {
    if (!window.confirm(`„${feld.label}" jetzt live auf der Seite aktualisieren?`)) return;
    setIsPending(true);
    setGespeichert(false);
    setFehler(null);
    const res = await fetch(`/api/admin/inhalte/${encodeURIComponent(feld.key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: wert }),
    });
    setIsPending(false);
    if (res.ok) {
      setGespeichert(true);
      setIstOverride(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setFehler(data?.error ?? "Speichern fehlgeschlagen.");
    }
  }

  async function zuruecksetzen() {
    if (!window.confirm(`„${feld.label}" wirklich auf den ursprünglichen Standardtext zurücksetzen?`)) return;
    setIsPending(true);
    setGespeichert(false);
    setFehler(null);
    const res = await fetch(`/api/admin/inhalte/${encodeURIComponent(feld.key)}`, { method: "DELETE" });
    setIsPending(false);
    if (res.ok) {
      const data = await res.json();
      setWert(data.value);
      setIstOverride(false);
      router.refresh();
    } else {
      setFehler("Zurücksetzen fehlgeschlagen.");
    }
  }

  function handleDatei(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    if (!datei) return;
    setFehler(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (dataUrl.length > SITE_CONTENT_MAX_LAENGE.bild) {
        setFehler("Bild ist zu groß (max. ca. 2 MB).");
        return;
      }
      setWert(dataUrl);
      setGespeichert(false);
    };
    reader.readAsDataURL(datei);
    // Erlaubt erneutes Auswählen derselben Datei (z.B. nach Fehler) - ohne Reset feuert "change"
    // beim zweiten Mal mit derselben Datei sonst nicht erneut.
    e.target.value = "";
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className={labelClass}>{feld.label}</span>
          {feld.hinweis && <p className="-mt-1 text-xs text-slate-400">{feld.hinweis}</p>}
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
            istOverride ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-500"
          }`}
        >
          {istOverride ? "Angepasst" : "Standard"}
        </span>
      </div>

      {feld.typ === "text" && (
        <input
          type="text"
          value={wert}
          maxLength={SITE_CONTENT_MAX_LAENGE.text}
          onChange={(e) => {
            setWert(e.target.value);
            setGespeichert(false);
          }}
          className={inputClass}
        />
      )}

      {feld.typ === "richtext" && (
        <textarea
          value={wert}
          maxLength={SITE_CONTENT_MAX_LAENGE.richtext}
          rows={3}
          onChange={(e) => {
            setWert(e.target.value);
            setGespeichert(false);
          }}
          className={`${inputClass} resize-y`}
        />
      )}

      {feld.typ === "bild" && (
        <div className="flex items-center gap-3">
          {wert ? (
            // eslint-disable-next-line @next/next/no-img-element -- data:-URL, kein next/image nötig
            <img src={wert} alt="" className="h-14 w-14 rounded-lg border border-slate-200 object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-400">
              kein Bild
            </span>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleDatei} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            <Upload size={14} /> Bild wählen
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={speichern}
          disabled={isPending || !geaendert}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
        >
          {gespeichert && <Check size={14} className="text-brand-600" />}
          {isPending ? "…" : "Speichern"}
        </button>
        {istOverride && (
          <button
            type="button"
            onClick={zuruecksetzen}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:text-red-600 disabled:opacity-60"
          >
            <RotateCcw size={13} /> Auf Standard zurücksetzen
          </button>
        )}
        {fehler && <p className="w-full text-xs text-red-600">{fehler}</p>}
      </div>
    </div>
  );
}
