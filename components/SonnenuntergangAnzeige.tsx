"use client";

import { useEffect, useState } from "react";
import { getTimes } from "suncalc";
import { Sunset } from "lucide-react";
import { ermittleAktuelleStadt } from "@/lib/sonnenzeiten";

/** Reine Info-Anzeige neben dem Hijri-Datum: Sonnenuntergangszeit für die aktuelle Stadt (aus der
 * Geräte-Zeitzone abgeleitet, siehe lib/sonnenzeiten.ts) - praktisch für den Maghrib-Gebetsbeginn,
 * der ab Sonnenuntergang eintritt. Bewusst OHNE jede Wirkung auf den Dark Mode (siehe
 * ThemeToggle.tsx, das ein rein manueller, nie automatischer Schalter ist) - dies hier ist nur
 * eine Anzeige, kein Schalter. Erst nach dem Mount berechnet (Zeitzone ist eine Browser-API), bis
 * dahin unsichtbar statt eines falschen Platzhalters. */
export default function SonnenuntergangAnzeige() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const stadt = ermittleAktuelleStadt();
    const { sunset } = getTimes(new Date(), stadt.lat, stadt.lon);
    if (!sunset) return;
    const uhrzeit = sunset.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
    setText(`Sonnenuntergang (Maghrib) ca. ${uhrzeit} · ${stadt.label}`);
  }, []);

  if (!text) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <Sunset size={11} strokeWidth={2.25} />
      {text}
    </span>
  );
}
