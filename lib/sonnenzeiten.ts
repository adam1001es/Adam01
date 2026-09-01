/**
 * Grobe Zuordnung Zeitzone -> Stadt + Koordinaten, um den Sonnenuntergang (siehe
 * components/SonnenuntergangAnzeige.tsx) ohne Geolocation-Berechtigungsdialog und ohne externen
 * Geocoding-Dienst für "die aktuelle Stadt, wo man die App nutzt" zu bestimmen: die IANA-Zeitzone
 * des Geräts (Intl.DateTimeFormat) entspricht praktisch immer der Region, in der sich die Person
 * gerade befindet, da Betriebssysteme das automatisch aus der Systemzeit-Einstellung ableiten.
 * Deckt bewusst nur eine überschaubare Auswahl größerer Städte ab (DACH-Raum, Naher Osten,
 * Balkan, weitere Weltstädte) - unbekannte Zeitzonen fallen auf Wien zurück, statt einen Fehler
 * zu werfen oder falsch zu raten.
 */

export interface StadtKoordinaten {
  label: string;
  lat: number;
  lon: number;
}

const ZEITZONE_ZU_STADT: Record<string, StadtKoordinaten> = {
  "Europe/Vienna": { label: "Wien", lat: 48.2082, lon: 16.3738 },
  "Europe/Berlin": { label: "Berlin", lat: 52.52, lon: 13.405 },
  "Europe/Zurich": { label: "Zürich", lat: 47.3769, lon: 8.5417 },
  "Europe/London": { label: "London", lat: 51.5074, lon: -0.1278 },
  "Europe/Paris": { label: "Paris", lat: 48.8566, lon: 2.3522 },
  "Europe/Rome": { label: "Rom", lat: 41.9028, lon: 12.4964 },
  "Europe/Madrid": { label: "Madrid", lat: 40.4168, lon: -3.7038 },
  "Europe/Amsterdam": { label: "Amsterdam", lat: 52.3676, lon: 4.9041 },
  "Europe/Brussels": { label: "Brüssel", lat: 50.8503, lon: 4.3517 },
  "Europe/Istanbul": { label: "Istanbul", lat: 41.0082, lon: 28.9784 },
  "Europe/Sarajevo": { label: "Sarajevo", lat: 43.8563, lon: 18.4131 },
  "Europe/Belgrade": { label: "Belgrad", lat: 44.7866, lon: 20.4489 },
  "Europe/Zagreb": { label: "Zagreb", lat: 45.815, lon: 15.9819 },
  "Europe/Skopje": { label: "Skopje", lat: 41.9981, lon: 21.4254 },
  "Europe/Warsaw": { label: "Warschau", lat: 52.2297, lon: 21.0122 },
  "Europe/Stockholm": { label: "Stockholm", lat: 59.3293, lon: 18.0686 },
  "Africa/Cairo": { label: "Kairo", lat: 30.0444, lon: 31.2357 },
  "Asia/Riyadh": { label: "Riad", lat: 24.7136, lon: 46.6753 },
  "Asia/Dubai": { label: "Dubai", lat: 25.2048, lon: 55.2708 },
  "Asia/Amman": { label: "Amman", lat: 31.9454, lon: 35.9284 },
  "Asia/Beirut": { label: "Beirut", lat: 33.8938, lon: 35.5018 },
  "Asia/Baghdad": { label: "Bagdad", lat: 33.3152, lon: 44.3661 },
  "Asia/Karachi": { label: "Karachi", lat: 24.8607, lon: 67.0011 },
  "Asia/Jakarta": { label: "Jakarta", lat: -6.2088, lon: 106.8456 },
  "America/New_York": { label: "New York", lat: 40.7128, lon: -74.006 },
  "America/Chicago": { label: "Chicago", lat: 41.8781, lon: -87.6298 },
  "America/Los_Angeles": { label: "Los Angeles", lat: 34.0522, lon: -118.2437 },
};

const WIEN: StadtKoordinaten = ZEITZONE_ZU_STADT["Europe/Vienna"];

/** Beste Näherung für "die Stadt, in der die App gerade genutzt wird" - siehe Modul-Kommentar. */
export function ermittleAktuelleStadt(): StadtKoordinaten {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return ZEITZONE_ZU_STADT[zone] ?? WIEN;
  } catch {
    return WIEN;
  }
}
