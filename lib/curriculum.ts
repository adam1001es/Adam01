/**
 * Grober Orientierungsrahmen für den islamischen Religionsunterricht in Österreich.
 *
 * Rechtliche Grundlage: "Lehrpläne für den islamischen Religionsunterricht in Österreich"
 * (IGGÖ-Schulamt, Stand 23.04.2021, vom Obersten Rat der IGGÖ beschlossen am 19.06.2021 -
 * "Lehrplan IRU NEU") - eine Adaptierung der 2011 mit BGBl. II Nr. 234/2011 verordneten
 * Lehrpläne im Rahmen des Vorhabens "Lehrplan Neu" des BMBWF. Die 2011er-Anlagen (u.a. für
 * Sonderschulen, AHS, BMHS) bleiben laut Vorwort des neuen Lehrplans ausdrücklich als
 * Handreichung weiter nutzbar und wurden für Detailtiefe ergänzend herangezogen, ebenso das
 * separate Dokument "Ethische Dimensionen des islamischen Religionsunterrichts" (Schulamt der
 * IGGÖ, Mai 2021) für die Oberstufen-Themen (9.-13. Schulstufe).
 *
 * Dieses Modul bildet NICHT den vollständigen Lehrplantext ab, sondern fasst die zentralen
 * Strukturelemente (Grundkompetenzen, Kompetenzbereiche, Schulstufen-Themen) zusammen, um die
 * KI-Generierung inhaltlich und altersmäßig zu verankern. Für verbindliche Einzelheiten ist
 * weiterhin der Lehrplan selbst sowie das IGGÖ-Schulamt maßgeblich - die Lehrkraft prüft die
 * konkrete Passung vor Einsatz im Unterricht.
 */

import type { Komplexitaet } from "./types";

/**
 * Die "sieben Grundkompetenzen" bilden laut Vorwort des Lehrplans IRU NEU dessen Herzstück -
 * sie werden mit steigendem Vertiefungsgrad über den gesamten islamischen Religionsunterricht
 * vermittelt. Der Feld-/Variablenname "Themenbereich" (statt "Grundkompetenz") ist bewusst
 * beibehalten: er zieht sich durch DB-Spalte, API-Schema und mehrere Komponenten, eine
 * Umbenennung hätte ohne inhaltlichen Mehrwert unnötig große Diffs/Risiko bedeutet - inhaltlich
 * bildet er jetzt aber die aktuellen Grundkompetenzen statt der alten, gröberen 4er-Einteilung
 * (Iman/Fiqh al-Ibadat/Fiqh al-Muamalat/Kulturgeschichte) ab. Bereits bestehende Arbeitsblätter
 * mit einem der alten Schlüssel fallen dank ThemenbereichSchema.catch("gemischt") (siehe
 * lib/types.ts und die worksheet/pdf/docx-Routen) automatisch sicher auf "gemischt" zurück,
 * statt beim Anzeigen abzustürzen.
 */
export const THEMENBEREICH_KEYS = [
  "selbsterkenntnis",
  "schoepfung",
  "glaubensbasis",
  "ibada",
  "quellentexte",
  "pluralitaet",
  "muamalat",
  "gemischt",
] as const;
export type ThemenbereichKey = (typeof THEMENBEREICH_KEYS)[number];

export const THEMENBEREICHE: Record<ThemenbereichKey, { label: string; beschreibung: string }> = {
  selbsterkenntnis: {
    label: "1. Selbsterkenntnis – Gottvertrauen – Vielfalt",
    beschreibung: "Mit einer Haltung des Vertrauens in sich und in Gott der Welt offen für ihre Vielfalt begegnen.",
  },
  schoepfung: {
    label: "2. Schöpfung – Verantwortung – Amanah",
    beschreibung: "In Liebe zur Schöpfung Beziehungen verantwortungsvoll und einfühlsam leben und die Umwelt schützen und bewahren.",
  },
  glaubensbasis: {
    label: "3. Glaubensbasis – Aqida",
    beschreibung: "Die Musliminnen und Muslime verbindende islamische Glaubensbasis verstehen, reflektieren und in der Gegenwartsgesellschaft kommunizieren können.",
  },
  ibada: {
    label: "4. Religiöses Handeln – Ibada",
    beschreibung: "Religiöses Handeln über das bloße Nachahmen hinaus individuell mit Sinn erfüllen (Gebet, Fasten, Zakat, Hadsch, rituelle Praxis).",
  },
  quellentexte: {
    label: "5. Umgang mit Quellentexten – Kontextualisierung",
    beschreibung: "Religiöse Quellentexte (Koran/Sunna) verstehen und befragen, Auslegungstraditionen kennen und auf den heutigen Kontext beziehen.",
  },
  pluralitaet: {
    label: "6. Pluralitätsfähigkeit – Sozialer Zusammenhalt",
    beschreibung: "Gemeinsamkeiten und Unterschiede zu anderen Religionen/Weltanschauungen kennen, dialogfähig den sozialen Zusammenhalt suchen.",
  },
  muamalat: {
    label: "7. Zwischenmenschliche Perspektive – Mu'amalat",
    beschreibung: "Die Aufrichtigkeit des Glaubens mit eigener Positionierung und ethischem Handeln im Hier und Jetzt verknüpfen: Gottesdienst als Menschendienst.",
  },
  gemischt: {
    label: "Grundkompetenz passend zum Thema wählen",
    beschreibung:
      "Ordne das Thema selbst der am besten passenden der sieben Grundkompetenzen zu oder kombiniere mehrere sinnvoll.",
  },
};

/** Die fünf Kompetenzbereiche, in denen die Grundkompetenzen laut Lehrplan IRU NEU trainiert
 * werden - unabhängig vom gewählten Themenbereich/Grundkompetenz relevant für die Mischung der
 * Aufgabentypen (z.B. sollte nicht jede Aufgabe nur "Wahrnehmen und beschreiben" verlangen). */
export const KOMPETENZBEREICHE = {
  a: "Wahrnehmen und beschreiben (Perzeption)",
  b: "Verstehen und deuten (Kognition)",
  c: "Gestalten und handeln (Performanz)",
  d: "Kommunizieren und (be)urteilen (Interaktion)",
  e: "Teilhaben und entscheiden (Partizipation)",
};

/** Die drei Kompetenzdimensionen, an denen sich der Lehrplan IRU NEU zusätzlich orientiert. */
export const KOMPETENZDIMENSIONEN = [
  "Menschen und ihre Lebensorientierung",
  "Gelehrte und gelebte Bezugsreligion",
  "Religion in Gesellschaft und Kultur in der Vielfalt religiöser und weltanschaulicher Zugänge",
];

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
  // Eine explizite "(N. Schulstufe)"-Angabe hat Vorrang vor der ersten Zahl im Text: bei z.B.
  // "6. Klasse AHS-Oberstufe/BMHS (10. Schulstufe)" ist die erste Zahl im Text die AHS-interne
  // Klassenzahl (6), nicht die bundesweite Schulstufe (10) - ohne diesen Vorrang würden alle
  // vier AHS-Oberstufe-Optionen (5.-8. Klasse) fälschlich als Sekundarstufe I statt II
  // eingestuft, weil ihre Klassenzahl zufällig immer <= 8 ist (dieselbe Technik wie in
  // holeSchulstufenThemen unten).
  const explizit = text.match(/(\d+)\.\s*schulstufe/);
  const zahl = explizit ? parseInt(explizit[1], 10) : parseInt(text.match(/\d+/)?.[0] ?? "", 10);

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
 * Reale, aus dem Lehrplan IRU NEU (Vorschule bis VIII. Schulstufe) sowie dem ergänzenden
 * Dokument "Ethische Dimensionen des islamischen Religionsunterrichts" (IX.-XIII. Schulstufe,
 * Schulamt der IGGÖ) entnommene Themenkreis-Überschriften je Schulstufe - NICHT die vollständige
 * Detailtiefe (Unterpunkte), sondern die Kapitel-/Themenkreis-Ebene. Dient als Grundlage für
 * Themenvorschläge im Formular und als Orientierung im Generierungs-Prompt (siehe
 * schulstufenThemen unten und app/new/NewWorksheetForm.tsx) - ersetzt NICHT die eigene fachliche
 * Prüfung durch die Lehrkraft.
 */
export const SCHULSTUFE_THEMEN_VORSCHULE: string[] = [
  "Wer bin ich?",
  "Ich kann schon sehr viel",
  "Allah ist mir nahe",
  "Ich beginne mit dem Namen Allahs",
  "Wie Menschen gut zusammenleben",
  "Ich helfe wo ich kann",
];

export const SCHULSTUFE_THEMEN: Record<number, string[]> = {
  1: [
    "Wir sind eine Gemeinschaft",
    "Freundschaft und Vertrauen",
    "Friede sei mit euch – Der Friedensgruß",
    "Bismillah – Mit dem Namen Allahs",
    "Allah liebt mich",
    "Die Propheten",
    "Die Engel",
    "Meine Familie",
    "Ich bemühe mich",
    "Was mich (er)nährt",
    "Ich lerne im Koran: Sura Al-Fatiha, Sura Al-Ichlas",
  ],
  2: [
    "Allah ist mein einziger Gott",
    "Ich liebe und schütze Allahs Schöpfung",
    "Muhammad (as) und sein Familienleben",
    "Alhamdulillah",
    "Die Moschee",
    "Mein Gebet",
    "Der Monat Ramadan",
    "Ich bin ein guter Mensch",
    "Geschichten von Propheten: Adam (as) und Hawa, Nuh (as)",
    "Ich lerne im Koran: Sura Quraisch, Al-Ma'uun, Al-Fiel",
  ],
  3: [
    "Die Glaubensgrundsätze – Ich glaube an…",
    "Allahs Wort – Der Koran",
    "Ich lerne das Gebet",
    "Der Ramadan ist da",
    "Die soziale Pflichtabgabe – Die Zakat",
    "Ich nehme meine Gefühle wahr",
    "Geschichten von Propheten: Musa (as), Isa (as) und Maryam, Yunus (as)",
    "Ich lerne im Koran: Al-Kafirun, Al-'Asr",
  ],
  4: [
    "Allah hat uns einzigartig erschaffen",
    "Ich übe Verantwortung",
    "Ich bete nur Allah an",
    "Hadithe – Was der Prophet Muhammad (as) sagte",
    "Der Fastenmonat Ramadan – Lailatul Qadr",
    "Die Hadsch – Pilgerfahrt",
    "Das Opferfest – Idul-Adha",
    "Offenbarungsreligionen: Judentum, Christentum",
    "So fühle ich mich zuhause – Ich wähle meinen Weg",
    "Geschichten von Propheten: Ibrahim (as), Yusuf (as)",
    "Ich lerne im Koran: Ayat al Kursi, Al-Qadr, At-Tin, Al-Kauthar",
  ],
  5: [
    "Islam, Iman und Ihsan",
    "Die Quellen des Islams: Koran und Sunna",
    "Geschichten von Propheten: die Sira des Propheten Muhammad (as), Yusuf (as)",
    "Das Miteinander friedvoll gestalten",
    "Kunst, Kultur und Wissenschaft im Islam: arabisches Alphabet, Kalligrafie",
    "Islam in Österreich und Europa",
    "Ein guter Mensch sein",
    "Friedliche Wege in der Konfliktlösung",
    "Verantwortung",
  ],
  6: [
    "Das tägliche rituelle Gebet (As-Salah)",
    "Bittgebet – Du'a",
    "Die Engel – Allahs Diener und Boten",
    "Die Quellen des Islams: die Offenbarung des Korans, die Kategorien der Sunna",
    "Islamische Geschichte: die vier rechtgeleiteten Kalifen",
    "Geschichten von Propheten: die Sira des Propheten (Medina), Sulaiman (as)",
    "Die Beurteilungskriterien im Islam: Fard, Mustahabb, Halal/Mubah, Makruh, Haram",
    "Miteinander leben",
    "Die Schöpfung bewahren",
    "Islamische Kunst, Kultur und Wissenschaft",
    "Islam in Österreich und Europa",
  ],
  7: [
    "Die Zakat – die sozial-religiöse Pflichtabgabe",
    "Die Hadsch und Umra",
    "Der Glaube (Iman) an die offenbarten Bücher",
    "Die Quellen des Islams: die Niederschrift des Korans, die wichtigsten Hadith-Überlieferer",
    "Islamische Geschichte: die Umayyaden",
    "Geschichten von Propheten: Musa (as)",
    "Sozialer Zusammenhalt",
    "Nationalismus und Rassismus",
    "Gewalt ablehnen",
    "Freiheit von Abhängigkeiten",
    "Islamische Architektur: die Moschee",
    "Islam in Österreich und Europa: das Islamgesetz von 1912 und 2015",
  ],
  8: [
    "Das Fasten (As-Siyam)",
    "Der Glaube (Iman) an die Propheten",
    "Der Glaube (Iman) an den Jüngsten Tag",
    "Die Quellen des Islams: die Rezitation des Korans, Hadithe und ihre Bedeutung",
    "Islamische Geschichte: die Abbasiden",
    "Geschichten von Propheten: Isa (as)",
    "Verantwortung in der Kommunikation",
    "Menschen auf der Flucht",
    "Islamische Kultur: die Madrasa, islamische Universitäten",
    "Islam in Österreich und Europa",
  ],
  9: [
    "Die Schöpfung: Entstehung der Welt, Adam (as) und Hawa, Menschenbild",
    "Der Koran – die Primärquelle des Islams",
    "Selbstverantwortung (Taklif): Mukallaf, Fard, Halal/Haram, Fiqh al-Mu'amalat",
    "Die Offenbarungsreligionen: Gemeinsamkeiten und Unterschiede",
    "Der Prophet Muhammad (as) – Sira und Sunna als Wegweiser",
    "Ethische Grundfrage „Ich zu mir selbst“: islamisches Menschenbild, Mündigkeit (Mukallaf)",
    "Ethische Grundfrage „Ich zu den Mitmenschen“: Menschenwürde unabhängig von Herkunft",
  ],
  10: [
    "Monotheismus (Tauhid): Allah, die Schahada, Allahs schöne Namen",
    "Werte und Ethik (Qiyam und Ahlaq): Islam als Religion der Orthopraxie",
    "Die Stellung des Islams zu Gewalt: der Begriff des Dschihad kritisch reflektiert",
    "Der Islam und die Menschenrechte: Menschenwürde, Maqasid asch-Scharia",
    "Die koranischen Geschichten: Prophetengeschichten, Gleichnisse",
    "Ethische Grundfrage „Ich zur Welt“: Kontextualisierung religiöser Quellentexte",
  ],
  11: [
    "Islam – Iman – Ihsan: die Arkan al-Islam, sechs Grundlagen des Glaubens",
    "Quellen des Islams und Interpretationsschulen: sunnitisch/schiitisch, Theologie im Kontext",
    "Geschlechtergerechtigkeit im Koran und in der islamischen Geschichte",
    "Musliminnen und Muslime in Österreich: Geschichte, Gründung der IGGÖ (1979)",
    "Einblicke in die islamische Geschichte: rechtgeleitete Kalifen, Umayyaden, Abbasiden, Al-Andalus",
    "Ethische Grundfrage „Ich zur Welt“: Verschwörungstheorien und Feindbilddenken erkennen",
  ],
  12: [
    "Jenseitsvorstellungen: Eschatologie, islamische Spitalsseelsorge, Bestattungskultur",
    "Bildung und Wissenschaft im Islam: das „Goldene Zeitalter“, Frauen in der Wissenschaft",
    "Ehe und Scheidung nach islamischem Verständnis",
    "Wirtschaftsethik aus islamischer Sicht",
    "Sufismus: Entstehungsgeschichte, „Durch Selbsterkenntnis zur Gotteserkenntnis“",
    "Ethische Grundfrage „Ich zu den Mitmenschen“: Fragen an den Grenzen des Lebens",
  ],
  13: [
    "Der Islam und die Wahrung der Schöpfung: Umweltschutzbemühungen",
    "Weltethos (nach Hans Küng): die „Goldene Regel“",
    "Disziplinen der islamischen Wissenschaften: Aqida, Fiqh, Usul, Koran-/Hadithwissenschaften",
    "Kunst und Ästhetik: islamische Architektur, zeitgenössische Herausforderungen",
  ],
};

/** Ermittelt zu einem freien Schulstufe-Text (siehe SCHULSTUFEN_OPTIONEN) die passenden
 * Themenvorschläge aus SCHULSTUFE_THEMEN/SCHULSTUFE_THEMEN_VORSCHULE - null, wenn sich keine
 * eindeutige Schulstufen-Nummer ableiten lässt (z.B. bei "Berufsschule", die im Lehrplan IRU NEU
 * nicht mit eigenen Schulstufen-Themen geführt wird). */
export function holeSchulstufenThemen(schulstufeText: string): string[] | null {
  const text = schulstufeText.toLowerCase();
  if (text.includes("vorschule")) return SCHULSTUFE_THEMEN_VORSCHULE;

  const explizit = text.match(/(\d+)\.\s*schulstufe/);
  if (explizit) return SCHULSTUFE_THEMEN[parseInt(explizit[1], 10)] ?? null;

  if (text.includes("volksschule") || text.includes("grundschule")) {
    const zahl = parseInt(text.match(/\d+/)?.[0] ?? "", 10);
    if (!Number.isNaN(zahl)) return SCHULSTUFE_THEMEN[zahl] ?? null;
  }
  if (text.includes("polytechnisch")) return SCHULSTUFE_THEMEN[9] ?? null;

  return null;
}

/**
 * Allgemeine didaktische Standards (nicht RU-spezifisch, im deutschsprachigen Schulwesen
 * fachübergreifend etabliert): die drei Anforderungsbereiche (AFB I-III), wie sie u.a. in der
 * österreichischen (Zentral-)Matura und in deutschen Bildungsstandards verwendet werden. Deckt
 * sich inhaltlich eng mit dem im Lehrplan IRU NEU selbst verwendeten Tiefenmodell
 * "Reproduktion – Transfer – Reflexion/Problemlösung" (siehe Kompetenzraster-Beispiel
 * "Friedensgruß" des IGGÖ-Schulamts) - beide Systeme meinen dieselbe Progression.
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

/** Verschiebt die AFB-Zielspanne innerhalb dessen, was die Schulstufe ohnehin zulässt - "einfach"
 * bewusst zum unteren, "anspruchsvoll" zum oberen Rand, "mittel" verändert nichts (unverändertes
 * Verhalten von vor dem Komplexitäts-Feature). Die Schulstufe bleibt die harte Altersgrenze, die
 * Komplexität wirkt nur INNERHALB davon. */
function komplexitaetsHinweis(komplexitaet: Komplexitaet): string {
  if (komplexitaet === "einfach") {
    return " Gewählte Komplexität \"Einfach\": bewege dich bewusst am UNTEREN Rand dieser Spanne (mehr AFB I, kürzere/einfachere Formulierungen), auch wenn die Schulstufe grundsätzlich mehr zuließe.";
  }
  if (komplexitaet === "anspruchsvoll") {
    return " Gewählte Komplexität \"Anspruchsvoll\": bewege dich bewusst am OBEREN Rand dieser Spanne (mehr AFB II/III wo die Schulstufe das zulässt, tiefere Fragestellungen, anspruchsvollere Antworterwartung bei offenen Fragen), aber bleibe innerhalb dessen, was für die Schulstufe altersgerecht ist.";
  }
  return "";
}

export function buildCurriculumSystemContext(
  themenbereich: ThemenbereichKey,
  schulstufeText: string,
  komplexitaet: Komplexitaet,
): string {
  const bereich = THEMENBEREICHE[themenbereich];
  const cluster = guessSchulstufenCluster(schulstufeText);
  const fruehLesend = istFrueheVolksschulstufe(schulstufeText);
  const schulstufenThemen = holeSchulstufenThemen(schulstufeText);

  const vorlesekundigHinweis = fruehLesend
    ? `

WICHTIG - noch nicht lese-/schreibkundige Kinder (1./2. Schulstufe Volksschule):
Diese Schüler:innen können noch nicht (oder kaum) lesen und schreiben. Aufgaben mit viel
Lesetext oder eigenständigem Schreiben (Lesetext, Lückentext, Wortsuche, Kreuzworträtsel, lange
offene Fragen) sind für sie NICHT geeignet und sollen vermieden werden. Nutze stattdessen bevorzugt
"malaufgabe" (eine kurze, mündlich vorlesbare Zeichenanweisung zum Thema - die Schüler:innen
zeichnen selbst auf dem ausgedruckten Blatt, KEIN von dir erzeugtes Bild) sowie ergänzend
"wahr_falsch" und "multiple_choice" mit ganz wenigen, kurzen Antwortoptionen (die die Lehrkraft
vorliest und die Kinder mündlich oder durch Zeigen beantworten) und "zuordnung" mit wenigen,
sehr kurzen Begriffen. Halte "frage"-Texte auf einen einzigen, ganz kurzen Satz beschränkt.
Setze "anforderungsbereich" bei diesen Aufgaben auf "afb1" (Wahrnehmen/Wiedererkennen).
"recherche_auftrag" ist für diese Stufe NIEMALS geeignet (setzt eigenständige Recherche voraus).`
    : "";

  const afbSpanne =
    cluster.id === "volksschule"
      ? "Volksschule: Schwerpunkt AFB I (nennen, beschreiben) mit ersten einfachen AFB-II-Ansätzen (erklären in eigenen Worten). Kein AFB III."
      : cluster.id === "sek1" || cluster.id === "poly"
        ? "Sekundarstufe I/Polytechnische Schule: Mischung aus AFB I und AFB II, erste einfache AFB-III-Ansätze (z.B. eigene Meinung kurz begründen)."
        : "Sekundarstufe II/Berufsschule: bewusste Mischung aus AFB I, II und III - mindestens eine Aufgabe soll Beurteilen/Begründen/Reflektieren (AFB III) verlangen.";

  const schulstufenThemenHinweis = schulstufenThemen
    ? `\n- Zur Orientierung: reale Themenkreise des Lehrplans IRU NEU für diese Schulstufe sind u.a. ${schulstufenThemen.slice(0, 6).map((t) => `"${t}"`).join(", ")}. Das von der Lehrkraft vorgegebene Thema hat Vorrang, aber Sprache/Tiefe/Perspektive dieser Themenkreise sind eine gute Referenz für das passende Niveau dieser Schulstufe.`
    : "";

  return `Orientierungsrahmen (Lehrplan für den islamischen Religionsunterricht in Österreich, IGGÖ-Schulamt, "Lehrplan IRU NEU" Stand 2021 - Grobstruktur, kein Volltext-Zitat):
- Grundkompetenz für dieses Arbeitsblatt: "${bereich.label}" - ${bereich.beschreibung}
- Schulstufen-Cluster: "${cluster.label}" - ${cluster.hinweis}
- Halte dich bei Sprache, Abstraktionsgrad und Aufgabenlänge strikt an dieses Schulstufen-Cluster.
- Achte darauf, dass der Inhalt klar zur genannten Grundkompetenz passt (bzw. bei "gemischt" die am besten passende der sieben Grundkompetenzen - Selbsterkenntnis, Schöpfung/Verantwortung, Glaubensbasis, Religiöses Handeln, Umgang mit Quellentexten, Pluralitätsfähigkeit, Zwischenmenschliche Perspektive - triffst).${schulstufenThemenHinweis}
- Kompetenzbereiche (fünf Dimensionen, wie eine Aufgabe eine Grundkompetenz trainiert - mische über das Arbeitsblatt hinweg, nicht jede Aufgabe muss denselben Kompetenzbereich ansprechen): ${Object.values(KOMPETENZBEREICHE).join(" · ")}.
- Hadithe ausschließlich aus: ${HADITH_QUELLEN.primaer.join(", ")} (bevorzugt), oder aus ${HADITH_QUELLEN.sekundaerNurWennAllgemeinAlsSahihBekannt.join(", ")} NUR wenn allgemein als sahih/gesichert bekannt. Keine schwachen (da'if) oder erfundenen (mawdu') Hadithe. Im Zweifel: Hadith weglassen und stattdessen auf den Koran oder etablierten Konsens zurückgreifen.
- Diese App bildet die Lehrplan-Struktur nur orientierend ab, nicht als Volltext. Die Lehrkraft prüft die konkrete Passung zur jeweiligen Schulart/Schulstufe weiterhin anhand des offiziellen Lehrplans.

Pädagogisch-didaktische Standards (im deutschsprachigen Schulwesen etablierte Aufgabenkultur):
- Anforderungsbereiche (AFB I-III): Jede Aufgabe bekommt im Feld "anforderungsbereich" den Wert "afb1" (Reproduktion: ${ANFORDERUNGSBEREICHE.afb1.operatoren.join("/")}), "afb2" (Transfer: ${ANFORDERUNGSBEREICHE.afb2.operatoren.join("/")}) oder "afb3" (Reflexion/Urteil: ${ANFORDERUNGSBEREICHE.afb3.operatoren.join("/")}). Verteilung für diese Schulstufe: ${afbSpanne}${komplexitaetsHinweis(komplexitaet)} Baue NICHT nur reine Abfrage-Aufgaben (AFB I).
- Kompetenzorientierung: Berücksichtige - altersgerecht und wo thematisch passend - mehr als nur Faktenwissen, orientiert an den oben genannten Kompetenzbereichen. Nicht jede Aufgabe muss jede Kompetenz abdecken, aber das Arbeitsblatt als Ganzes soll nicht nur auf Auswendiglernen abzielen.
- Das "lernziel" MUSS kompetenzorientiert/operationalisiert formuliert sein, mit einem Verb passend zum höchsten enthaltenen Anforderungsbereich (z.B. "Die Schüler:innen können ... nennen/beschreiben" bei reinem AFB I, "... erklären/vergleichen" bei AFB II, "... beurteilen/begründen" bei AFB III).
- Sprachsensibler Unterricht: kurze, klare Sätze passend zur Schulstufe; erkläre Fachbegriffe und arabische Begriffe im Kontext, statt sie unerklärt vorauszusetzen.
- Lebensweltbezug: verknüpfe Inhalte, wo sinnvoll, mit dem Alltag der Schüler:innen in Österreich (Familie, Schule, gesellschaftliches Zusammenleben) statt rein abstrakt zu bleiben.${vorlesekundigHinweis}`;
}
