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
];
