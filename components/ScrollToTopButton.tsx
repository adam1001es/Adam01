"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

// Ab wieviel Pixeln Scroll-Distanz der Button erscheint - klein genug, um schon auf mittellangen
// Seiten (nicht nur der sehr langen Landingpage) zu greifen, aber groß genug, dass er nicht sofort
// beim minimalen Scrollen aufblitzt.
const SICHTBAR_AB_PX = 400;

/** Ersatz für den fehlenden sticky-Header (siehe components/SiteHeader.tsx, Kommentar zu "NICHT
 * MEHR sticky" - ein Rendering-Bug auf iPhone/Firefox zwang dazu, den Header ganz normal
 * mitscrollen zu lassen). Ohne einen fixen Kopfbereich gab es auf langen Seiten (v.a. Landingpage,
 * lange Arbeitsblatt-Listen) keine schnelle Möglichkeit mehr, zur Navigation im Header
 * zurückzukommen, ohne manuell zurückzuscrollen. Bewusst EIN einzelner, immer gleicher Button
 * ("nach oben") statt einer zweiten, parallelen Navigations-Liste im Fließtext - von dort ist die
 * echte Navigation im Header sofort wieder erreichbar, ohne die Header-Nav-Logik zu duplizieren. */
export default function ScrollToTopButton() {
  const [sichtbar, setSichtbar] = useState(false);

  useEffect(() => {
    const handleScroll = () => setSichtbar(window.scrollY > SICHTBAR_AB_PX);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!sichtbar) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Nach oben scrollen, zur Navigation"
      className="no-print animate-fade-in fixed bottom-5 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-card-hover transition hover:bg-brand-700 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <ArrowUp size={20} strokeWidth={2.25} />
    </button>
  );
}
