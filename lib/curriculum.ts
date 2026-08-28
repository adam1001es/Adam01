/**
 * Grober Orientierungsrahmen für den islamischen Religionsunterricht in Österreich.
 *
 * Rechtliche Grundlage: Lehrpläne für den islamischen Religionsunterricht an Pflichtschulen,
 * mittleren und höheren Schulen, erlassen von der Islamischen Glaubensgemeinschaft in
 * Österreich (IGGÖ) gem. § 2 Abs. 2 Religionsunterrichtsgesetz, kundgemacht mit BGBl. II
 * Nr. 234/2011 (mehrere Anlagen je Schulart).
 *
 * Dieses Modul bildet NICHT den vollständigen Gesetzestext ab (der App liegt kein Volltext
 * der Anlagen vor) - es fasst die öffentlich bekannte Grobstruktur zusammen, um die
 * KI-Generierung inhaltlich und altersmäßig zu verankern. Für verbindliche Einzelheiten je
 * Schulart/Schulstufe ist weiterhin BGBl. II Nr. 234/2011 (bzw. dessen Novellen) sowie das
 * IGGÖ-Schulamt maßgeblich - die Lehrkraft muss dies vor Einsatz gegenprüfen.
 */

export const THEMENBEREICH_KEYS = ["iman", "ibadat", "muamalat", "kulturgeschichte", "gemischt"] as const;
export type ThemenbereichKey = (typeof THEMENBEREICH_KEYS)[number];

export const THEMENBEREICHE: Record<ThemenbereichKey, { label: string; beschreibung: string }> = {
  iman: {
    label: "Iman (Glaubenslehre)",
    beschreibung:
      "Glaubensgrundsätze: Gottesbild (Tauhid), Engel, die Propheten, die Offenbarungsschriften, das Jenseits, Vorherbestimmung.",
  },
  ibadat: {
    label: "Fiqh al-Ibadat (gottesdienstliche Praxis)",
    beschreibung:
      "Die 5 Säulen des Islam, Gebet (Salat), Fasten (Sawm), Abgabe (Zakat), Wallfahrt (Hadsch), rituelle Reinheit (Wudu/Ghusl).",
  },
  muamalat: {
    label: "Fiqh al-Muamalat (zwischenmenschliche Beziehungen/Ethik)",
    beschreibung:
      "Umgang miteinander, Familie, Gemeinschaft/Gesellschaft, Werte und Tugenden (Akhlaq), Konfliktlösung, Zusammenleben in Österreich.",
  },
  kulturgeschichte: {
    label: "Islamische Kulturgeschichte",
    beschreibung:
      "Prophetengeschichte (Sira), Geschichte der islamischen Zivilisation, bedeutende Persönlichkeiten und Ereignisse.",
  },
  gemischt: {
    label: "Themenbereich passend zum Thema wählen",
    beschreibung:
      "Ordne das Thema selbst dem am besten passenden der vier Themenbereiche zu (Iman, Fiqh al-Ibadat, Fiqh al-Muamalat, Islamische Kulturgeschichte) oder kombiniere sie sinnvoll.",
  },
};

export interface SchulstufenCluster {
  id: string;
  label: string;
  hinweis: string;
}

export const SCHULSTUFEN_CLUSTER: SchulstufenCluster[] = [
  {
    id: "volksschule",
    label: "Volksschule (1.–4. Schulstufe)",
    hinweis:
      "Rahmencharakter, an konkreter Lebenswelt der Kinder orientiert. Sehr einfache Sprache, kurze Sätze, konkrete/anschauliche Beispiele, viel Bildhaftes, keine abstrakte Theologie. Typische Themen: Allah, Gemeinschaft, Familie, Muhammad (Prophet), Koran, Engel, einfache Grundlagen der Gottesdienstlichen Praxis.",
  },
  {
    id: "sek1",
    label: "Sekundarstufe I (Mittelschule/AHS-Unterstufe, 5.–8. Schulstufe)",
    hinweis:
      "Zunehmend differenzierte Begriffe, erste einfache Begründungszusammenhänge, Bezug zur Lebenswelt Jugendlicher, Alltagsfragen, Gruppenarbeit/Diskussion möglich.",
  },
  {
    id: "poly",
    label: "Polytechnische Schule (9. Schulstufe)",
    hinweis:
      "Berufs- und lebensweltorientiert, alltagspraktische Ethik- und Wertefragen, kompakte Aufgabenformate.",
  },
  {
    id: "sek2",
    label: "Sekundarstufe II (AHS-Oberstufe/BMHS, 9.–13. Schulstufe)",
    hinweis:
      "Abstraktere theologische und ethische Reflexion möglich, Quellenarbeit (Koran/Hadith) mit Kontext, Bezug zu gesellschaftlichen und interreligiösen Fragestellungen, eigenständige Urteilsbildung fördern.",
  },
  {
    id: "berufsschule",
    label: "Berufsschule",
    hinweis:
      "Kompakt, alltags- und berufsweltbezogen, wenig Zeit pro Einheit - klare, kurze Aufgabenformate bevorzugen.",
  },
];

/** Kuratierte Schulstufen-Auswahl fürs Formular (statt Freitext-Eingabe). */
export const SCHULSTUFEN_OPTIONEN: string[] = [
  "1. Klasse Volksschule",
  "2. Klasse Volksschule",
  "3. Klasse Volksschule",
  "4. Klasse Volksschule",
  "1. Klasse Mittelschule/AHS-Unterstufe (5. Schulstufe)",
  "2. Klasse Mittelschule/AHS-Unterstufe (6. Schulstufe)",
  "3. Klasse Mittelschule/AHS-Unterstufe (7. Schulstufe)",
  "4. Klasse Mittelschule/AHS-Unterstufe (8. Schulstufe)",
  "Polytechnische Schule (9. Schulstufe)",
  "5. Klasse AHS-Oberstufe/BMHS (9. Schulstufe)",
  "6. Klasse AHS-Oberstufe/BMHS (10. Schulstufe)",
  "7. Klasse AHS-Oberstufe/BMHS (11. Schulstufe)",
  "8. Klasse AHS-Oberstufe/BMHS (12. Schulstufe)",
  "Berufsschule",
];

export function guessSchulstufenCluster(schulstufeText: string): SchulstufenCluster {
  const text = schulstufeText.toLowerCase();
  const zahl = parseInt(text.match(/\d+/)?.[0] ?? "", 10);

  if (text.includes("volksschule") || text.includes("grundschule")) return SCHULSTUFEN_CLUSTER[0];
  if (text.includes("polytechnisch")) return SCHULSTUFEN_CLUSTER[2];
  if (text.includes("berufsschule") || text.includes("lehrling")) return SCHULSTUFEN_CLUSTER[4];
  if (text.includes("ahs") || text.includes("oberstufe") || text.includes("bmhs") || text.includes("gymnasium")) {
    if (!Number.isNaN(zahl) && zahl <= 8) return SCHULSTUFEN_CLUSTER[1];
    return SCHULSTUFEN_CLUSTER[3];
  }
  if (text.includes("mittelschule") || text.includes("unterstufe")) return SCHULSTUFEN_CLUSTER[1];

  if (!Number.isNaN(zahl)) {
    if (zahl <= 4) return SCHULSTUFEN_CLUSTER[0];
    if (zahl <= 8) return SCHULSTUFEN_CLUSTER[1];
    if (zahl === 9) return SCHULSTUFEN_CLUSTER[2];
    return SCHULSTUFEN_CLUSTER[3];
  }

  // Ohne eindeutigen Hinweis: mittlere Komplexitätsstufe als vorsichtiger Default.
  return SCHULSTUFEN_CLUSTER[1];
}

/** Hadith-Sammlungen, die im österreichischen IGGÖ-Lehrplan/Unterrichtsmaterialien als anerkannt gelten. */
export const HADITH_QUELLEN = {
  primaer: ["Sahih al-Bukhari", "Sahih Muslim"],
  sekundaerNurWennAllgemeinAlsSahihBekannt: [
    "Sunan at-Tirmidhi",
    "Sunan Abi Dawud",
    "Sunan an-Nasa'i",
    "Sunan Ibn Maja",
  ],
};

export function buildCurriculumSystemContext(themenbereich: ThemenbereichKey, schulstufeText: string): string {
  const bereich = THEMENBEREICHE[themenbereich];
  const cluster = guessSchulstufenCluster(schulstufeText);

  return `Orientierungsrahmen (österreichischer Lehrplan für islamischen Religionsunterricht, IGGÖ, BGBl. II Nr. 234/2011 - Grobstruktur, kein Volltext-Zitat):
- Themenbereich für dieses Arbeitsblatt: "${bereich.label}" - ${bereich.beschreibung}
- Schulstufen-Cluster: "${cluster.label}" - ${cluster.hinweis}
- Halte dich bei Sprache, Abstraktionsgrad und Aufgabenlänge strikt an dieses Schulstufen-Cluster.
- Achte darauf, dass der Inhalt klar in den genannten Themenbereich passt (bzw. bei "gemischt" den am besten passenden der vier Bereiche - Iman, Fiqh al-Ibadat, Fiqh al-Muamalat, Islamische Kulturgeschichte - triffst).
- Hadithe ausschließlich aus: ${HADITH_QUELLEN.primaer.join(", ")} (bevorzugt), oder aus ${HADITH_QUELLEN.sekundaerNurWennAllgemeinAlsSahihBekannt.join(", ")} NUR wenn allgemein als sahih/gesichert bekannt. Keine schwachen (da'if) oder erfundenen (mawdu') Hadithe. Im Zweifel: Hadith weglassen und stattdessen auf den Koran oder etablierten Konsens zurückgreifen.
- Diese App bildet die Lehrplan-Struktur nur orientierend ab, nicht als Volltext. Die Lehrkraft prüft die konkrete Passung zur jeweiligen Schulart/Schulstufe weiterhin anhand von BGBl. II Nr. 234/2011.`;
}
