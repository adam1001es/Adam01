"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { AVATAR_EMOJIS, AVATAR_FARBEN } from "@/lib/profil";

export default function AvatarForm({
  initialEmoji,
  initialFarbe,
  onGespeichert,
}: {
  initialEmoji: string;
  initialFarbe: string;
  /** Wird kurz nach erfolgreichem Speichern aufgerufen (z.B. um die umschließende
   * EinklappbareSectionCard automatisch wieder zuzuklappen). */
  onGespeichert?: () => void;
}) {
  const router = useRouter();
  const [emoji, setEmoji] = useState(initialEmoji);
  const [farbe, setFarbe] = useState(initialFarbe);
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);

  const veraendert = emoji !== initialEmoji || farbe !== initialFarbe;

  async function speichern() {
    setIsPending(true);
    setFehler(null);
    setGespeichert(false);

    const res = await fetch("/api/account/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarEmoji: emoji, avatarFarbe: farbe }),
    });
    const data = await res.json().catch(() => ({}));
    setIsPending(false);

    if (!res.ok) {
      setFehler(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setGespeichert(true);
    router.refresh();
    if (onGespeichert) setTimeout(onGespeichert, 900);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-black/10 text-3xl shadow-inner ring-2 ring-white"
          style={{ backgroundColor: farbe }}
        >
          {emoji}
        </span>
        <p className="text-xs leading-relaxed text-slate-400">
          So erscheint dein Kürzel oben im Menü - und später, sobald der Austausch-Bereich
          kommt, auch dort für andere Lehrkräfte.
        </p>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Symbol</span>
        <div className="flex flex-wrap gap-2">
          {AVATAR_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                setEmoji(e);
                setGespeichert(false);
              }}
              aria-label={e}
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition ${
                emoji === e
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                  : "border-slate-200 bg-surface hover:border-brand-300"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Farbe</span>
        <div className="flex flex-wrap gap-2">
          {AVATAR_FARBEN.map((f) => {
            // Weiß braucht einen sichtbaren Rand, sonst verschwindet der Swatch auf dem hellen
            // Karten-Hintergrund - bei den übrigen (kräftigen) Farbtönen reicht der Farbkontrast
            // selbst, ein zusätzlicher Rand wäre dort nur unruhiger. Aus demselben Grund braucht
            // das Häkchen dort einen dunklen statt weißen Strich, um sichtbar zu bleiben.
            const istWeiss = f.wert === "#ffffff";
            return (
              <button
                key={f.wert}
                type="button"
                onClick={() => {
                  setFarbe(f.wert);
                  setGespeichert(false);
                }}
                title={f.label}
                aria-label={f.label}
                className={`flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 transition ${
                  istWeiss ? "border border-slate-200" : ""
                } ${farbe === f.wert ? "ring-2 ring-slate-400" : "hover:opacity-80"}`}
                style={{ backgroundColor: f.wert }}
              >
                {farbe === f.wert && (
                  <Check size={14} className={istWeiss ? "text-slate-500" : "text-white"} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {fehler && (
        <div className="max-w-xs rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
          {fehler}
        </div>
      )}

      <button
        type="button"
        onClick={speichern}
        disabled={isPending || !veraendert}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
      >
        {gespeichert && <Check size={14} className="text-brand-600" />}
        {isPending ? "…" : "Speichern"}
      </button>
    </div>
  );
}
