"use client";

import { useEffect, useState } from "react";
import { Link2, Copy, Check, X } from "lucide-react";

/** Nur für die Besitzerin/den Besitzer eines Arbeitsblatts - schaltet einen öffentlichen, NICHT
 * angemeldeten Link frei (siehe app/blatt/[token], app/api/worksheet/[id]/link), über den auch
 * ohne Konto direkt auf das Arbeitsblatt zugegriffen werden kann. Bewusst getrennt von
 * TeilenButton (Community-Sichtbarkeit unter Abo-Konten) - hier geht es um den externen Versand,
 * z.B. über WhatsApp, statt das PDF herunterzuladen und woanders wieder hochzuladen. */
export default function LinkTeilenButton({
  worksheetId,
  initialToken,
}: {
  worksheetId: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState(initialToken);
  const [offen, setOffen] = useState(false);
  const [laden, setLaden] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  // Erst nach dem Mounten gesetzt (nie während des Server-Renderings verfügbar) - der Link wird
  // dadurch erst sichtbar, wenn "offen" ohnehin schon true ist (siehe onClick unten), also nie
  // vor dem ersten Klick der Nutzerin/des Nutzers benötigt.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const link = token ? `${origin}/blatt/${token}` : null;

  async function schalte(aktiv: boolean) {
    setLaden(true);
    setFehler(null);
    try {
      const res = await fetch(`/api/worksheet/${worksheetId}/link`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktiv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Aktion fehlgeschlagen.");
      setToken(data.token);
      setOffen(aktiv);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLaden(false);
    }
  }

  async function kopieren() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
    } catch {
      setFehler("Kopieren nicht möglich - Link bitte manuell markieren.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (token ? setOffen((o) => !o) : schalte(true))}
        disabled={laden}
        title={
          token
            ? "Öffentlichen Link anzeigen"
            : "Öffentlichen Link erzeugen - abrufbar ohne Anmeldung, z.B. zum Versand über WhatsApp"
        }
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium shadow-sm transition disabled:opacity-60 ${
          token
            ? "border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-300"
            : "border-slate-200 bg-surface text-slate-600 hover:border-brand-300 hover:text-brand-700"
        }`}
      >
        <Link2 size={15} /> {token ? "Öffentlicher Link" : "Per Link teilen"}
      </button>

      {offen && link && (
        <div className="mt-1 flex w-full basis-full flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm">
          <code className="min-w-0 flex-1 truncate text-xs text-brand-800">{link}</code>
          <button
            type="button"
            onClick={kopieren}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-brand-300 bg-surface px-2.5 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
          >
            {kopiert ? <Check size={13} /> : <Copy size={13} />} {kopiert ? "Kopiert" : "Kopieren"}
          </button>
          <button
            type="button"
            onClick={() => schalte(false)}
            disabled={laden}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-red-500 transition hover:text-red-700"
          >
            <X size={13} /> Deaktivieren
          </button>
        </div>
      )}
      {fehler && <p className="mt-1 w-full basis-full text-xs text-red-600">{fehler}</p>}
    </>
  );
}
