/** Fragenkatalog für das Wahr/Falsch-Kästchen-Puzzle "Wissensblöcke" (siehe
 * components/WissensBloecke.tsx, app/werkzeuge/spiel). Fünf Kategorien:
 * - "schulrecht": Basisfakten zum österreichischen Schulrecht (Schulpflichtgesetz,
 *   Schulunterrichtsgesetz, Leistungsbeurteilungsverordnung), bewusst einfach und ohne
 *   Sonderfälle/Ausnahmen gehalten - recherchiert, siehe Quellen im Session-Verlauf.
 * - "islamisch_paedagogik": bewusst KEINE neuen theologischen Behauptungen (die würden eine
 *   Admin-Prüfung wie in lib/wissensbasis.ts brauchen), sondern reine Meta-Fakten zur Struktur
 *   des Lehrplans, die bereits an anderer Stelle in der App verankert und geprüft sind (siehe
 *   THEMENBEREICHE/SCHULSTUFEN_CLUSTER in lib/curriculum.ts).
 * - "islamisches_wissen": echte islamische Inhalte, aber bewusst NUR unstrittige, mainstream
 *   anerkannte Basisfakten (5 Säulen, Ramadan, Koran-Aufbau, Feiertagsnamen) - dieselbe Art
 *   Fakten, die auch der bestehende, frei zugängliche "Islamischer Schuljahres-Kalender"
 *   (lib/islamischeFeiertage.ts) ohne Admin-Freigabe zeigt. Keine interpretativen/strittigen
 *   theologischen Aussagen, keine Hadith-Authentizitätsfragen (dafür bleibt die admin-geprüfte
 *   Wissensbasis zuständig).
 * - "paedagogik": allgemeine unterrichtsmethodische Grundlagen, u.a. aus den bereits in
 *   lib/curriculum.ts verankerten Anforderungsbereichen (AFB I-III).
 * - "schulleben": einfache organisatorische Fakten rund um den österreichischen Schulalltag.
 */

export interface SpielFrage {
  id: string;
  text: string;
  wahr: boolean;
  kategorie: "schulrecht" | "islamisch_paedagogik" | "islamisches_wissen" | "paedagogik" | "schulleben";
}

export const SPIEL_FRAGEN: SpielFrage[] = [
  {
    id: "sr-1",
    text: "Die allgemeine Schulpflicht beginnt mit 1. September nach Vollendung des 6. Lebensjahres.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-2",
    text: "Die Schulpflicht dauert in Österreich insgesamt 9 Schuljahre.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-3",
    text: "Die Schulpflicht dauert in Österreich insgesamt 8 Schuljahre.",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "sr-4",
    text: "Ob ein Kind in Österreich schulpflichtig ist, hängt von der österreichischen Staatsbürgerschaft ab.",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "sr-5",
    text: "Bei mehr als 3 unentschuldigten Fehltagen kann eine Anzeige der Erziehungsberechtigten drohen.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-6",
    text: "In Österreich gibt es eine 5-stufige Notenskala von \"Sehr gut\" bis \"Nicht genügend\".",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-7",
    text: "In Österreich gibt es eine 6-stufige Notenskala.",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "sr-8",
    text: "\"Genügend\" ist die beste mögliche Schulnote in Österreich.",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "sr-9",
    text: "Die Abmeldung vom Religionsunterricht muss innerhalb der ersten 5 Kalendertage des Schuljahres schriftlich erfolgen.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-10",
    text: "Eine Abmeldung vom Religionsunterricht ist jederzeit im Schuljahr formlos mündlich möglich.",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "sr-11",
    text: "Ab 14 Jahren können sich Schüler:innen selbst vom Religionsunterricht abmelden, ohne Zustimmung der Eltern.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-12",
    text: "Erst ab 18 Jahren dürfen sich Schüler:innen selbst vom Religionsunterricht abmelden.",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "sr-13",
    text: "Bis zum 10. Geburtstag bestimmen die Eltern die Religionszugehörigkeit ihres Kindes.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-14",
    text: "Die Aufsichtspflicht einer Lehrkraft beginnt exakt mit dem Stundenbeginn, keine Minute früher.",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "sr-15",
    text: "Die Aufsichtspflicht kann ab der 9. Schulstufe je nach Reife der Schüler:innen entfallen.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-16",
    text: "Religionsmündigkeit in Österreich beginnt mit 16 Jahren.",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "sr-17",
    text: "Zwischen dem 10. und 12. Geburtstag entscheiden Kinder komplett allein über ihre Religionszugehörigkeit, ohne dass die Eltern gefragt werden.",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "ip-1",
    text: "Der Lehrplan des islamischen Religionsunterrichts gliedert sich in 7 Grundkompetenzen.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-2",
    text: "Der Lehrplan des islamischen Religionsunterrichts gliedert sich in 5 Grundkompetenzen.",
    wahr: false,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-3",
    text: "\"Schöpfung – Verantwortung – Amanah\" ist eine der 7 Grundkompetenzen.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-4",
    text: "\"Zwischenmenschliche Perspektive – Mu'amalat\" ist eine der 7 Grundkompetenzen.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-5",
    text: "\"Wirtschaft und Finanzen\" ist eine der 7 Grundkompetenzen.",
    wahr: false,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-6",
    text: "\"Glaubensbasis – Aqida\" gehört zu den 7 Grundkompetenzen.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-7",
    text: "\"Umgang mit Quellentexten – Kontextualisierung\" ist eine der 7 Grundkompetenzen.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-8",
    text: "Die Polytechnische Schule entspricht der 9. Schulstufe.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-9",
    text: "Die AHS-Oberstufe umfasst die 9. bis 13. Schulstufe.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-10",
    text: "Die Sekundarstufe I (Mittelschule/AHS-Unterstufe) umfasst die 1. bis 4. Schulstufe.",
    wahr: false,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "iw-1",
    text: "Der Islam kennt fünf Säulen, darunter das tägliche Gebet (Salat).",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-2",
    text: "Der Islam kennt sechs Säulen.",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-3",
    text: "Der Fastenmonat im Islam heißt Ramadan.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-4",
    text: "Ramadan ist der dritte Monat des islamischen (Hijri-)Kalenders.",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-5",
    text: "Der Koran besteht aus 114 Suren.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-6",
    text: "Der Koran besteht aus 99 Suren.",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-7",
    text: "Eid al-Fitr (Ramadanfest) markiert das Ende des Fastenmonats Ramadan.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-8",
    text: "Eid al-Adha wird auch als \"Opferfest\" bezeichnet.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-9",
    text: "Die Pilgerfahrt nach Mekka wird Hajj genannt.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-10",
    text: "Die Gebetsrichtung im Islam (Qibla) zeigt nach Medina.",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-11",
    text: "Aschura wird im ersten Monat des islamischen Kalenders (Muharram) begangen.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-12",
    text: "Mawlid an-Nabi erinnert an die Geburt des Propheten Muhammad.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "pd-1",
    text: "Im Unterricht unterscheidet man häufig drei Anforderungsbereiche: Reproduktion, Reorganisation/Transfer und Reflexion/Urteil.",
    wahr: true,
    kategorie: "paedagogik",
  },
  {
    id: "pd-2",
    text: "Es gibt im Unterricht nur einen einzigen Anforderungsbereich.",
    wahr: false,
    kategorie: "paedagogik",
  },
  {
    id: "pd-3",
    text: "\"Nennen\" und \"beschreiben\" sind typische Operatoren für AFB I (Reproduktion).",
    wahr: true,
    kategorie: "paedagogik",
  },
  {
    id: "pd-4",
    text: "\"Beurteilen\" und \"begründen\" sind typische Operatoren für AFB I (Reproduktion).",
    wahr: false,
    kategorie: "paedagogik",
  },
  {
    id: "pd-5",
    text: "Formatives Assessment bedeutet laufende Rückmeldung während des Lernprozesses, nicht nur eine Abschlussnote.",
    wahr: true,
    kategorie: "paedagogik",
  },
  {
    id: "pd-6",
    text: "Differenzierter Unterricht bedeutet, unterschiedliche Lernniveaus in einer Klasse zu berücksichtigen.",
    wahr: true,
    kategorie: "paedagogik",
  },
  {
    id: "pd-7",
    text: "Differenzierter Unterricht bedeutet, dass alle Schüler:innen exakt dieselbe Aufgabe zur exakt gleichen Zeit bearbeiten müssen.",
    wahr: false,
    kategorie: "paedagogik",
  },
  {
    id: "sl-1",
    text: "Ein österreichisches Schuljahr ist in zwei Semester gegliedert.",
    wahr: true,
    kategorie: "schulleben",
  },
  {
    id: "sl-2",
    text: "Ein österreichisches Schuljahr hat nur ein einziges Semester.",
    wahr: false,
    kategorie: "schulleben",
  },
  {
    id: "sl-3",
    text: "In Österreich gibt es Weihnachtsferien.",
    wahr: true,
    kategorie: "schulleben",
  },
  {
    id: "sl-4",
    text: "In Österreich gibt es keine Sommerferien.",
    wahr: false,
    kategorie: "schulleben",
  },
  {
    id: "sl-5",
    text: "Ein Elternsprechtag dient dem Austausch zwischen Lehrkräften und Erziehungsberechtigten.",
    wahr: true,
    kategorie: "schulleben",
  },

  // Erweiterung: weitere Fragen, damit sich der begrenzte Fragenkatalog beim Spielen nicht so
  // schnell wiederholt. Gleiche Prinzipien wie oben - schulrecht/paedagogik-Ergänzungen sind
  // entweder Umformulierungen bereits recherchierter Fakten (siehe Kommentare der ersten Fragen
  // je Kategorie) oder direkt aus lib/curriculum.ts (Grundkompetenzen/Kompetenzbereiche/
  // Schulstufen-Cluster) bzw. lib/islamischeFeiertage.ts (Hijri-Monate) abgeleitet, islamisches
  // Grundwissen bleibt auf unstrittige Mainstream-Basisfakten beschränkt.
  {
    id: "sr-18",
    text: "Religionsmündigkeit in Österreich beginnt mit 14 Jahren.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-19",
    text: "Die Volksschule dauert in Österreich 4 Jahre.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-20",
    text: "Die Volksschule dauert in Österreich 6 Jahre.",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "sr-21",
    text: "Die Sekundarstufe I umfasst die 5. bis 8. Schulstufe.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-22",
    text: "\"Sehr gut\" ist die beste mögliche Schulnote in Österreich.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-23",
    text: "\"Nicht genügend\" ist eine positive, also eine bestandene Note.",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "sr-24",
    text: "Kinder mit ausländischer Staatsbürgerschaft, die in Österreich wohnen, sind ebenfalls schulpflichtig.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-25",
    text: "Die 5 Notenstufen in Österreich lauten: Sehr gut, Gut, Befriedigend, Genügend, Nicht genügend.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "sr-26",
    text: "\"Befriedigend\" ist eine schlechtere Note als \"Genügend\".",
    wahr: false,
    kategorie: "schulrecht",
  },
  {
    id: "sr-27",
    text: "\"Gut\" ist die zweitbeste Schulnote in Österreich.",
    wahr: true,
    kategorie: "schulrecht",
  },
  {
    id: "ip-11",
    text: "\"Selbsterkenntnis – Gottvertrauen – Vielfalt\" ist eine der 7 Grundkompetenzen.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-12",
    text: "\"Religiöses Handeln – Ibada\" ist eine der 7 Grundkompetenzen.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-13",
    text: "\"Pluralitätsfähigkeit – Sozialer Zusammenhalt\" ist eine der 7 Grundkompetenzen.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-14",
    text: "\"Berufsorientierung\" ist eine der 7 Grundkompetenzen im Lehrplan IRU NEU.",
    wahr: false,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-15",
    text: "\"Digitale Kompetenz\" ist eine der 7 Grundkompetenzen im Lehrplan IRU NEU.",
    wahr: false,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-16",
    text: "Im Lehrplan IRU NEU werden die Grundkompetenzen in fünf Kompetenzbereichen trainiert.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-17",
    text: "Im Lehrplan IRU NEU gibt es nur einen einzigen Kompetenzbereich.",
    wahr: false,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-18",
    text: "\"Wahrnehmen und beschreiben\" ist einer der fünf Kompetenzbereiche.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-19",
    text: "\"Gestalten und handeln\" ist einer der fünf Kompetenzbereiche.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-20",
    text: "\"Auswendiglernen ohne Verständnis\" ist einer der fünf Kompetenzbereiche.",
    wahr: false,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-21",
    text: "Die Volksschule umfasst die 1. bis 4. Schulstufe.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-22",
    text: "Die Sekundarstufe I (Mittelschule/AHS-Unterstufe) umfasst die 5. bis 8. Schulstufe.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-23",
    text: "Die Berufsschule zählt zur Sekundarstufe II.",
    wahr: false,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "ip-24",
    text: "Die AHS-Oberstufe endet mit der 13. Schulstufe.",
    wahr: true,
    kategorie: "islamisch_paedagogik",
  },
  {
    id: "iw-13",
    text: "Muslime beten in der Regel fünfmal täglich.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-14",
    text: "Muslime beten laut den fünf Säulen nur einmal täglich.",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-15",
    text: "Zakat ist die islamische Pflichtabgabe/Almosensteuer.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-16",
    text: "Zakat bedeutet, dass man niemals etwas abgeben muss.",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-17",
    text: "Die Pilgerfahrt Hajj findet in Mekka statt.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-18",
    text: "Die Pilgerfahrt Hajj findet in Medina statt.",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-19",
    text: "Der Koran ist in Kapitel gegliedert, die Suren genannt werden.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-20",
    text: "Die erste Sure des Korans heißt Al-Fatiha.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-21",
    text: "Mawlid an-Nabi wird im dritten Monat des islamischen Kalenders (Rabi al-Awwal) begangen.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-22",
    text: "Eid al-Adha (Opferfest) findet im 12. Monat des islamischen Kalenders statt.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-23",
    text: "Eid al-Adha findet im selben Monat wie Ramadan statt.",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-24",
    text: "Lailat al-Qadr (Nacht der Bestimmung) wird gegen Ende des Ramadan begangen.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-25",
    text: "Der islamische Kalender ist wie der gregorianische ein reiner Sonnenkalender.",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-26",
    text: "Der islamische (Hijri-)Kalender ist ein Mondkalender.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-27",
    text: "Ein islamisches Jahr hat mit ca. 354 Tagen weniger Tage als das Sonnenjahr.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-28",
    text: "Das Glaubensbekenntnis im Islam heißt Schahada.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-29",
    text: "Schahada ist der Name des Fastenmonats.",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-30",
    text: "Die Gebetsrichtung im Islam (Qibla) zeigt nach Mekka.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-31",
    text: "Der Gebetsruf zum Gebet heißt Adhan.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-32",
    text: "Eine Moschee wird auf Arabisch \"Masjid\" genannt.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-33",
    text: "Barmherzigkeit gilt im Islam als zentraler Wert.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-34",
    text: "\"Bismillah\" bedeutet \"Im Namen Gottes\".",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-35",
    text: "\"Alhamdulillah\" bedeutet \"Alles Lob gebührt Gott\".",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-36",
    text: "\"Inshallah\" bedeutet \"Auf keinen Fall\".",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-37",
    text: "Ramadan dauert etwa einen Monat.",
    wahr: true,
    kategorie: "islamisches_wissen",
  },
  {
    id: "iw-38",
    text: "Ramadan dauert das ganze Jahr.",
    wahr: false,
    kategorie: "islamisches_wissen",
  },
  {
    id: "pd-8",
    text: "\"Analysieren\" und \"vergleichen\" sind typische Operatoren für AFB II (Reorganisation/Transfer).",
    wahr: true,
    kategorie: "paedagogik",
  },
  {
    id: "pd-9",
    text: "\"Beurteilen\" und \"bewerten\" sind typische Operatoren für AFB III (Reflexion/Urteil).",
    wahr: true,
    kategorie: "paedagogik",
  },
  {
    id: "pd-10",
    text: "AFB steht für \"Anforderungsbereich\".",
    wahr: true,
    kategorie: "paedagogik",
  },
  {
    id: "pd-11",
    text: "Es gibt im Unterricht insgesamt fünf Anforderungsbereiche.",
    wahr: false,
    kategorie: "paedagogik",
  },
  {
    id: "pd-12",
    text: "Summative Beurteilung erfolgt typischerweise am Ende einer Lerneinheit, z.B. als Test.",
    wahr: true,
    kategorie: "paedagogik",
  },
  {
    id: "pd-13",
    text: "Formatives Assessment findet ausschließlich am Schulschluss statt.",
    wahr: false,
    kategorie: "paedagogik",
  },
  {
    id: "pd-14",
    text: "Kompetenzorientierter Unterricht bedeutet, ausschließlich Fakten auswendig zu lernen.",
    wahr: false,
    kategorie: "paedagogik",
  },
  {
    id: "pd-15",
    text: "Methodenvielfalt bedeutet, im Unterricht unterschiedliche Lehr- und Lernmethoden einzusetzen.",
    wahr: true,
    kategorie: "paedagogik",
  },
  {
    id: "pd-16",
    text: "Ein Lernziel sollte möglichst konkret und überprüfbar formuliert sein.",
    wahr: true,
    kategorie: "paedagogik",
  },
  {
    id: "pd-17",
    text: "Scaffolding bezeichnet das schrittweise Abbauen von Unterstützung, sobald Schüler:innen sicherer werden.",
    wahr: true,
    kategorie: "paedagogik",
  },
  {
    id: "pd-18",
    text: "Beim kooperativen Lernen arbeiten Schüler:innen ausschließlich einzeln, nie in Gruppen.",
    wahr: false,
    kategorie: "paedagogik",
  },
  {
    id: "sl-6",
    text: "In Österreich gibt es Semesterferien.",
    wahr: true,
    kategorie: "schulleben",
  },
  {
    id: "sl-7",
    text: "In Österreich gibt es keine Semesterferien.",
    wahr: false,
    kategorie: "schulleben",
  },
  {
    id: "sl-8",
    text: "In Österreich gibt es Osterferien.",
    wahr: true,
    kategorie: "schulleben",
  },
  {
    id: "sl-9",
    text: "In Österreich gibt es kurze Herbstferien rund um den Nationalfeiertag (26. Oktober).",
    wahr: true,
    kategorie: "schulleben",
  },
  {
    id: "sl-10",
    text: "In Österreich gibt es keinerlei schulfreie Tage im Herbst.",
    wahr: false,
    kategorie: "schulleben",
  },
  {
    id: "sl-11",
    text: "Volksschule, Mittelschule und AHS sind Beispiele für Schultypen in Österreich.",
    wahr: true,
    kategorie: "schulleben",
  },
  {
    id: "sl-12",
    text: "In Österreich gibt es nur einen einzigen Schultyp für alle Schulstufen.",
    wahr: false,
    kategorie: "schulleben",
  },
  {
    id: "sl-13",
    text: "Der Schulanfang liegt in Österreich meist im September.",
    wahr: true,
    kategorie: "schulleben",
  },
  {
    id: "sl-14",
    text: "Das Schuljahr endet in Österreich meist im Dezember.",
    wahr: false,
    kategorie: "schulleben",
  },
  {
    id: "sl-15",
    text: "Ein Klassenvorstand bzw. eine Klassenvorständin ist eine zentrale Ansprechperson für eine Klasse.",
    wahr: true,
    kategorie: "schulleben",
  },
  {
    id: "sl-16",
    text: "Ein Elternverein kann sich für die Anliegen der Erziehungsberechtigten an einer Schule einsetzen.",
    wahr: true,
    kategorie: "schulleben",
  },
];
