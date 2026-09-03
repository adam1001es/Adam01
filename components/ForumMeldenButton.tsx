"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import type { ForumMeldungZielTyp } from "@/lib/forum";

/** Meldet einen einzelnen Forum-Beitrag (Thema, Antwort oder Chat-Nachricht) wegen
 * unangemessenen Verhaltens (siehe app/api/forum/meldungen, app/admin/forum-meldungen). Der
 * Grund wird per window.prompt abgefragt statt eines eigenen Formulars - passt zur Größe der
 * Aktion (ein kurzer Freitext, kein eigener Dialog nötig). */
export default function ForumMeldenButton({
  zielTyp,
  zielId,
}: {
  zielTyp: ForumMeldungZielTyp;
  zielId: string;
}) {
  const [gemeldet, setGemeldet] = useState(false);

  async function melden() {
    const grund = window.prompt("Warum meldest du diesen Beitrag? (optional)");
    if (grund === null) return; // Abgebrochen (Cancel) - keine Meldung senden

    const res = await fetch("/api/forum/meldungen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zielTyp, zielId, grund: grund || undefined }),
    });
    if (res.ok) {
      setGemeldet(true);
    } else {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Meldung konnte nicht gesendet werden.");
    }
  }

  if (gemeldet) {
    return <span className="text-xs text-slate-400">Gemeldet</span>;
  }

  return (
    <button
      type="button"
      onClick={melden}
      title="Beitrag melden"
      aria-label="Beitrag melden"
      className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-red-600"
    >
      <Flag size={12} /> Melden
    </button>
  );
}
