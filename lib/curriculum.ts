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

import { ICON_KEYS, ICONS } from "./icons";

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

/**
 * Schüler:innen der 1./2. Schulstufe (1./2. Klasse Volksschule) sind zu Schulbeginn noch nicht
 * lese-/schreibkundig - klassische Text-Aufgabentypen (Lückentext, offene Frage, ...) sind für
 * sie kaum nutzbar. Für diese Stufe werden bildbasierte Aufgabentypen (Ausmalbild,
 * Bildergeschichte mit Vorlesetext für die Lehrkraft) bevorzugt.
 */
export function istFrueheVolksschulstufe(schulstufeText: string): boolean {
  const text = schulstufeText.toLowerCase();
  const zahl = parseInt(text.match(/\d+/)?.[0] ?? "", 10);
  if (!text.includes("volksschule") && !text.includes("grundschule")) return false;
  if (Number.isNaN(zahl)) return false;
  return zahl <= 2;
}

/**
 * Allgemeine didaktische Standards (nicht RU-spezifisch, im deutschsprachigen Schulwesen
 * fachübergreifend etabliert): die drei Anforderungsbereiche (AFB I-III), wie sie u.a. in der
 * österreichischen (Zentral-)Matura und in deutschen Bildungsstandards verwendet werden.
 */
export const ANFORDERUNGSBEREICHE_KEYS = ["afb1", "afb2", "afb3"] as const;
export type AnforderungsbereichKey = (typeof ANFORDERUNGSBEREICHE_KEYS)[number];

export const ANFORDERUNGSBEREICHE: Record<
  AnforderungsbereichKey,
  { label: string; beschreibung: string; operatoren: string[] }
> = {
  afb1: {
    label: "AFB I – Reproduktion",
    beschreibung: "Wiedergeben von Sachverhalten/Fakten im gelernten Zusammenhang.",
    operatoren: ["nennen", "beschreiben", "wiedergeben", "aufzählen"],
  },
  afb2: {
    label: "AFB II – Reorganisation/Transfer",
    beschreibung: "Erklären, Vergleichen, Anwenden und Übertragen auf vergleichbare neue Zusammenhänge.",
    operatoren: ["erklären", "vergleichen", "erläutern", "einordnen", "anwenden"],
  },
  afb3: {
    label: "AFB III – Reflexion/Urteil",
    beschreibung: "Eigenständige Deutungen, Begründungen und Bewertungen komplexer Sachverhalte.",
    operatoren: ["beurteilen", "Stellung nehmen", "reflektieren", "begründen", "diskutieren"],
  },
};

/**
 * Kompetenzbereiche des Religionsunterrichts: angelehnt an das gemeinsame, konfessions-
 * übergreifende Kompetenzmodell für den Religionsunterricht in Österreich (Sekundarstufe II/
 * Reifeprüfung, von den für RU verantwortlichen Kirchen/Religionsgesellschaften vereinbart) -
 * hier altersgerecht auf alle Schulstufen herunterskaliert.
 */
export const KOMPETENZBEREICHE_RU = {
  wahrnehmung: "Wahrnehmungskompetenz – religiöse/ethische Fragen, Symbole und Ausdrucksformen wahrnehmen und beschreiben",
  sachDarstellung: "Religiöse Sach- und Darstellungskompetenz – fachliches Wissen sachgerecht darstellen und erklären",
  interkulturellInterreligioes: "Interkulturelle und interreligiöse Kompetenz – eigene Position im Verhältnis zu anderen Positionen einordnen",
  ethischeDeutungUrteil: "Ethische Deutungs- und Urteilskompetenz – Sachverhalte deuten, ethisch reflektieren, begründet Stellung beziehen",
  lebensweltlicheAnwendung: "Lebensweltliche Anwendungskompetenz – Gelerntes auf die eigene Lebenswelt beziehen und anwenden",
};

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
  const fruehLesend = istFrueheVolksschulstufe(schulstufeText);

  const iconListe = ICON_KEYS.map((k) => `"${k}" (${ICONS[k].label})`).join(", ");
  const vorlesekundigHinweis = fruehLesend
    ? `

WICHTIG - noch nicht lese-/schreibkundige Kinder (1./2. Schulstufe Volksschule):
Diese Schüler:innen können noch nicht (oder kaum) lesen und schreiben. Textlastige Aufgabentypen
(Lückentext, offene Frage, Multiple Choice mit viel Lesetext, Wahr/Falsch als Lesetext) sind für
sie NICHT geeignet und sollen vermieden bzw. nur ganz vereinzelt und mit sehr wenigen, sehr
kurzen Wörtern eingesetzt werden. Verwende stattdessen überwiegend die bildbasierten Aufgabentypen:
- "ausmalbild": ein Bild-Symbol zum Ausmalen. Feld "frage" ist eine ganz kurze, einfache Anweisung, die die Lehrkraft vorliest (z.B. "Male die Moschee bunt aus.").
- "bildergeschichte": eine kleine Bildergeschichte aus 3-5 Schritten. Feld "bildergeschichteSchritte" ist ein Array von Objekten { ..., "vorlesetext": <ein kurzer, einfacher Satz, den die Lehrkraft laut vorliest> }. Feld "frage" ist eine kurze Überschrift/Rahmenanweisung (z.B. "Hört gut zu und schaut euch die Bilder an.").
Bei "bild" bzw. den "bild"-Feldern in "bildergeschichteSchritte" GENAU EINES von zwei Feldern setzen (siehe Hauptanweisung): entweder "bild" mit einem dieser Schlüssel: ${iconListe} - ODER "bildBeschreibung" mit einer kurzen NEUEN Motiv-Beschreibung (nur Gegenstände/Tiere/Natur/Gebäude, niemals Menschen/Gesichter/religiöse Figuren). Bevorzuge die feste Liste, wenn ein Schlüssel gut passt; nutze "bildBeschreibung" nur für zusätzliche Abwechslung. Setze "anforderungsbereich" bei diesen Aufgaben auf "afb1" (Wahrnehmen/Wiedererkennen). Ein Arbeitsblatt für diese Stufe soll überwiegend aus "ausmalbild"- und "bildergeschichte"-Aufgaben bestehen.`
    : "";

  const afbSpanne =
    cluster.id === "volksschule"
      ? "Volksschule: Schwerpunkt AFB I (nennen, beschreiben) mit ersten einfachen AFB-II-Ansätzen (erklären in eigenen Worten). Kein AFB III."
      : cluster.id === "sek1" || cluster.id === "poly"
        ? "Sekundarstufe I/Polytechnische Schule: Mischung aus AFB I und AFB II, erste einfache AFB-III-Ansätze (z.B. eigene Meinung kurz begründen)."
        : "Sekundarstufe II/Berufsschule: bewusste Mischung aus AFB I, II und III - mindestens eine Aufgabe soll Beurteilen/Begründen/Reflektieren (AFB III) verlangen.";

  return `Orientierungsrahmen (österreichischer Lehrplan für islamischen Religionsunterricht, IGGÖ, BGBl. II Nr. 234/2011 - Grobstruktur, kein Volltext-Zitat):
- Themenbereich für dieses Arbeitsblatt: "${bereich.label}" - ${bereich.beschreibung}
- Schulstufen-Cluster: "${cluster.label}" - ${cluster.hinweis}
- Halte dich bei Sprache, Abstraktionsgrad und Aufgabenlänge strikt an dieses Schulstufen-Cluster.
- Achte darauf, dass der Inhalt klar in den genannten Themenbereich passt (bzw. bei "gemischt" den am besten passenden der vier Bereiche - Iman, Fiqh al-Ibadat, Fiqh al-Muamalat, Islamische Kulturgeschichte - triffst).
- Hadithe ausschließlich aus: ${HADITH_QUELLEN.primaer.join(", ")} (bevorzugt), oder aus ${HADITH_QUELLEN.sekundaerNurWennAllgemeinAlsSahihBekannt.join(", ")} NUR wenn allgemein als sahih/gesichert bekannt. Keine schwachen (da'if) oder erfundenen (mawdu') Hadithe. Im Zweifel: Hadith weglassen und stattdessen auf den Koran oder etablierten Konsens zurückgreifen.
- Diese App bildet die Lehrplan-Struktur nur orientierend ab, nicht als Volltext. Die Lehrkraft prüft die konkrete Passung zur jeweiligen Schulart/Schulstufe weiterhin anhand von BGBl. II Nr. 234/2011.

Pädagogisch-didaktische Standards (im deutschsprachigen Schulwesen etablierte Aufgabenkultur):
- Anforderungsbereiche (AFB I-III): Jede Aufgabe bekommt im Feld "anforderungsbereich" den Wert "afb1" (Reproduktion: ${ANFORDERUNGSBEREICHE.afb1.operatoren.join("/")}), "afb2" (Transfer: ${ANFORDERUNGSBEREICHE.afb2.operatoren.join("/")}) oder "afb3" (Reflexion/Urteil: ${ANFORDERUNGSBEREICHE.afb3.operatoren.join("/")}). Verteilung für diese Schulstufe: ${afbSpanne} Baue NICHT nur reine Abfrage-Aufgaben (AFB I).
- Kompetenzorientierung: Berücksichtige - altersgerecht und wo thematisch passend - mehr als nur Faktenwissen, orientiert an den anerkannten Kompetenzbereichen des Religionsunterrichts (Wahrnehmung, religiöse Sach-/Darstellungskompetenz, interkulturelle/interreligiöse Kompetenz, ethische Deutungs-/Urteilskompetenz, lebensweltliche Anwendungskompetenz). Nicht jede Aufgabe muss jede Kompetenz abdecken, aber das Arbeitsblatt als Ganzes soll nicht nur auf Auswendiglernen abzielen.
- Das "lernziel" MUSS kompetenzorientiert/operationalisiert formuliert sein, mit einem Verb passend zum höchsten enthaltenen Anforderungsbereich (z.B. "Die Schüler:innen können ... nennen/beschreiben" bei reinem AFB I, "... erklären/vergleichen" bei AFB II, "... beurteilen/begründen" bei AFB III).
- Sprachsensibler Unterricht: kurze, klare Sätze passend zur Schulstufe; erkläre Fachbegriffe und arabische Begriffe im Kontext, statt sie unerklärt vorauszusetzen.
- Lebensweltbezug: verknüpfe Inhalte, wo sinnvoll, mit dem Alltag der Schüler:innen in Österreich (Familie, Schule, gesellschaftliches Zusammenleben) statt rein abstrakt zu bleiben.${vorlesekundigHinweis}`;
}
