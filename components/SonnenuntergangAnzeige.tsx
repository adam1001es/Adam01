"use client";

import { useEffect, useState } from "react";
import { getTimes } from "suncalc";
import { motion } from "framer-motion";
import { Sunset, Sunrise } from "lucide-react";
import { ermittleAktuelleStadt } from "@/lib/sonnenzeiten";

interface Anzeige {
  text: string;
  richtung: "auf" | "unter";
}

/** Nächstes Sonnenereignis (Auf- oder Untergang) für die aktuelle Stadt - liegt der heutige
 * Sonnenuntergang bereits in der Vergangenheit, zählt der morgige Sonnenaufgang, nicht der
 * veraltete heutige Wert. */
function naechstesEreignis(lat: number, lon: number): Anzeige | null {
  const jetzt = new Date();
  const heute = getTimes(jetzt, lat, lon);

  if (heute.sunrise && jetzt < heute.sunrise) {
    return { text: heute.sunrise.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" }), richtung: "auf" };
  }
  if (heute.sunset && jetzt < heute.sunset) {
    return { text: heute.sunset.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" }), richtung: "unter" };
  }
  const morgen = new Date(jetzt.getTime() + 24 * 60 * 60 * 1000);
  const sunriseMorgen = getTimes(morgen, lat, lon).sunrise;
  if (!sunriseMorgen) return null;
  return { text: sunriseMorgen.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" }), richtung: "auf" };
}

/** Reine Info-Anzeige neben dem Hijri-Datum: Zeit des jeweils NÄCHSTEN Sonnenereignisses (Auf-
 * oder Untergang, je nachdem was gerade ansteht) für die aktuelle Stadt (aus der Geräte-Zeitzone
 * abgeleitet, siehe lib/sonnenzeiten.ts) - praktisch u.a. für den Maghrib-Gebetsbeginn, der ab
 * Sonnenuntergang eintritt. Das Icon animiert sanft in die jeweilige Richtung (auf/unter), rein
 * dekorativ, kein Bezug zur echten Sonnenposition. Bewusst OHNE jede Wirkung auf den Dark Mode
 * (siehe ThemeToggle.tsx, das ein rein manueller, nie automatischer Schalter ist) - dies hier ist
 * nur eine Anzeige, kein Schalter. Erst nach dem Mount berechnet (Zeitzone ist eine Browser-API),
 * bis dahin unsichtbar statt eines falschen Platzhalters. */
export default function SonnenuntergangAnzeige() {
  const [anzeige, setAnzeige] = useState<Anzeige | null>(null);
  const [stadtLabel, setStadtLabel] = useState<string | null>(null);

  useEffect(() => {
    const stadt = ermittleAktuelleStadt();
    const ereignis = naechstesEreignis(stadt.lat, stadt.lon);
    if (!ereignis) return;
    setAnzeige(ereignis);
    setStadtLabel(stadt.label);
  }, []);

  if (!anzeige || !stadtLabel) return null;

  const Icon = anzeige.richtung === "auf" ? Sunrise : Sunset;
  const label = anzeige.richtung === "auf" ? "Sonnenaufgang" : "Sonnenuntergang";
  // Sonnenaufgang wandert nach oben, Sonnenuntergang nach unten - sehr klein und langsam, damit
  // es als angenehmes Detail auffällt statt als Ablenkung.
  const y = anzeige.richtung === "auf" ? [0, -2.5, 0] : [0, 2.5, 0];

  return (
    <span className="inline-flex items-center gap-1.5">
      <motion.span
        className="inline-flex"
        animate={{ y }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon size={11} strokeWidth={2.25} />
      </motion.span>
      {label} ca. {anzeige.text} · {stadtLabel}
    </span>
  );
}
