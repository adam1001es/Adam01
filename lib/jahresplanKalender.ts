/**
 * Offizielle Wochenraster-Daten für die Jahresplanung (Schuljahr 2026/27), 1:1 übernommen aus den
 * beiden vom Fachinspektor übermittelten Word-Vorlagen des Schulamts der IGGÖ ("Islamischer
 * Religionsunterricht (Vorlage bearbeitet durch das Schulamt der IGGÖ)"). Österreichische Schulen
 * starten je nach Bundesland an einem von zwei Terminen - deshalb zwei komplette Wochenlisten
 * ("Varianten"), nicht eine gemeinsame mit Bundesland-Zuordnung: welches Bundesland welchen
 * Starttermin hat, wechselt jährlich und stand in den Vorlagen selbst nicht dabei - die Lehrkraft
 * wählt daher direkt nach dem TATSÄCHLICHEN Schulbeginn ihrer eigenen Schule, ein Faktum, das sie
 * ohnehin kennt, statt dass wir eine Bundesland-Zuordnung raten.
 *
 * Enthält NUR die mechanisch aus dem Kalender ableitbaren Spalten (Woche, Datum, Hijri-Datum,
 * Anmerkung mit Ferien/Feiertagen) - "Wochenthema"/"Kompetenzen"/"Notizen danach" trägt die
 * Lehrkraft im Editor selbst ein (siehe lib/jahresplan.ts, JahresplanWoche in prisma/schema.prisma).
 *
 * WICHTIG bei einem neuen Schuljahr: Sobald das Schulamt eine neue Vorlage für ein weiteres
 * Schuljahr schickt, hier einen weiteren Eintrag in JAHRESPLAN_KALENDER_VARIANTEN ergänzen (gleiche
 * Struktur, neues "schuljahr"/"schulbeginn") - KEINE Daten selbst schätzen/interpolieren, da dieser
 * Datensatz eine Dienstpflicht-Dokumentation stützt und deshalb nur exakt das abbilden darf, was
 * offiziell übermittelt wurde.
 */

export interface JahresplanKalenderWoche {
  nummer: number;
  semester: 1 | 2;
  /** ISO-Datum (YYYY-MM-DD), Wochenbeginn (Montag). */
  von: string;
  /** ISO-Datum (YYYY-MM-DD), Wochenende (Sonntag). */
  bis: string;
  /** Hijri-Datumsspanne exakt wie in der offiziellen Vorlage angegeben (kein Neuberechnen - die
   * Vorlage kann bewusst geringfügig vom tabellarischen Algorithmus in lib/hijri.ts abweichen). */
  hijri: string;
  /** Eine Zeile pro Anmerkung (Ferien, staatliche/islamische Feiertage, Aktionstage). Leeres Array,
   * wenn die Vorlage für diese Woche keine Anmerkung enthielt. */
  anmerkungen: string[];
}

export interface JahresplanKalenderVariante {
  id: string;
  /** Für die Auswahl im "Neue Jahresplanung"-Formular - benennt den Schulbeginn-Termin, NICHT ein
   * Bundesland (siehe Modul-Kommentar oben). */
  label: string;
  schuljahr: string;
  wochen: JahresplanKalenderWoche[];
}

const VARIANTE_07_09: JahresplanKalenderWoche[] = [
  { nummer: 1, semester: 1, von: "2026-09-07", bis: "2026-09-13", hijri: "25. Rabi al-Awwal – 2. Rabi al-Achir 1448", anmerkungen: ["Schulbeginn: 07.09.2026"] },
  { nummer: 2, semester: 1, von: "2026-09-14", bis: "2026-09-20", hijri: "3.–9. Rabi al-Achir 1448", anmerkungen: [] },
  { nummer: 3, semester: 1, von: "2026-09-21", bis: "2026-09-27", hijri: "10.–16. Rabi al-Achir 1448", anmerkungen: ["21.09.: Weltfriedenstag", "26.09.: Europäischer Tag der Sprachen"] },
  { nummer: 4, semester: 1, von: "2026-09-28", bis: "2026-10-04", hijri: "17.–23. Rabi al-Achir 1448", anmerkungen: ["04.10.: Welttierschutztag"] },
  { nummer: 5, semester: 1, von: "2026-10-05", bis: "2026-10-11", hijri: "24.–30. Rabi al-Achir 1448", anmerkungen: ["05.10.: Weltlehrertag"] },
  { nummer: 6, semester: 1, von: "2026-10-12", bis: "2026-10-18", hijri: "1.–7. Dschumada al-Ula 1448", anmerkungen: ["16.10.: Welternährungstag"] },
  { nummer: 7, semester: 1, von: "2026-10-19", bis: "2026-10-25", hijri: "8.–14. Dschumada al-Ula 1448", anmerkungen: [] },
  { nummer: 8, semester: 1, von: "2026-10-26", bis: "2026-11-01", hijri: "15.–21. Dschumada al-Ula 1448", anmerkungen: ["Herbstferien 27.10. – 31.10.2026", "26.10.: Nationalfeiertag", "31.10.: Weltspartag", "01.11.: Allerheiligen"] },
  { nummer: 9, semester: 1, von: "2026-11-02", bis: "2026-11-08", hijri: "22.–28. Dschumada al-Ula 1448", anmerkungen: ["02.11.: Allerseelen"] },
  { nummer: 10, semester: 1, von: "2026-11-09", bis: "2026-11-15", hijri: "29. Dschumada al-Ula – 6. Dschumada al-Achira 1448", anmerkungen: ["13.11.: Tag des Apfels", "15.11.: Landespatron Hl. Leopold"] },
  { nummer: 11, semester: 1, von: "2026-11-16", bis: "2026-11-22", hijri: "7.–13. Dschumada al-Achira 1448", anmerkungen: ["20.11.: Tag der Kinderrechte"] },
  { nummer: 12, semester: 1, von: "2026-11-23", bis: "2026-11-29", hijri: "14.–20. Dschumada al-Achira 1448", anmerkungen: ["29.11.: 1. Adventsonntag"] },
  { nummer: 13, semester: 1, von: "2026-11-30", bis: "2026-12-06", hijri: "21.–27. Dschumada al-Achira 1448", anmerkungen: ["04.12.: Hl. Barbara", "06.12.: Hl. Nikolaus"] },
  { nummer: 14, semester: 1, von: "2026-12-07", bis: "2026-12-13", hijri: "28. Dschumada al-Achira – 4. Radschab 1448", anmerkungen: ["08.12.: Mariä Empfängnis", "Do., 10.12.: Beginn der drei heiligen Monate", "Do., 10.12.: Regaib-Nacht"] },
  { nummer: 15, semester: 1, von: "2026-12-14", bis: "2026-12-20", hijri: "5.–11. Radschab 1448", anmerkungen: [] },
  { nummer: 16, semester: 1, von: "2026-12-21", bis: "2026-12-27", hijri: "12.–18. Radschab 1448", anmerkungen: ["Weihnachtsferien 24.12.2026 – 06.01.2027", "25.12.: Weihnachten", "26.12.: Stephanstag"] },
  { nummer: 17, semester: 1, von: "2026-12-28", bis: "2027-01-03", hijri: "19.–25. Radschab 1448", anmerkungen: ["Weihnachtsferien 24.12.2026 – 06.01.2027"] },
  { nummer: 18, semester: 1, von: "2027-01-04", bis: "2027-01-10", hijri: "26. Radschab – 2. Schaban 1448", anmerkungen: ["Weihnachtsferien 24.12.2026 – 06.01.2027", "06.01.: Heilige Drei Könige", "10.01.: Tag der Blockflöte", "Mo., 04.01.: Miradsch-Nacht"] },
  { nummer: 19, semester: 1, von: "2027-01-11", bis: "2027-01-17", hijri: "3.–9. Schaban 1448", anmerkungen: [] },
  { nummer: 20, semester: 1, von: "2027-01-18", bis: "2027-01-24", hijri: "10.–16. Schaban 1448", anmerkungen: ["24.01.: Welttag der Bildung", "Fr., 22.01.: Berat-Nacht"] },
  { nummer: 21, semester: 1, von: "2027-01-25", bis: "2027-01-31", hijri: "17.–23. Schaban 1448", anmerkungen: ["26.01.: Welttag der Umweltbildung"] },
  { nummer: 22, semester: 1, von: "2027-02-01", bis: "2027-02-07", hijri: "24.–30. Schaban 1448", anmerkungen: ["Semesterferien 01.02. - 06.02.2027"] },
  { nummer: 23, semester: 2, von: "2027-02-08", bis: "2027-02-14", hijri: "1.–7. Ramadan 1448", anmerkungen: ["Mo., 08.02.: Beginn des Ramadan", "09.02.: Safer Internet Day", "09.02.: Faschingsdienstag"] },
  { nummer: 24, semester: 2, von: "2027-02-15", bis: "2027-02-21", hijri: "8.–14. Ramadan 1448", anmerkungen: ["21.02.: Tag der Muttersprache"] },
  { nummer: 25, semester: 2, von: "2027-02-22", bis: "2027-02-28", hijri: "15.–21. Ramadan 1448", anmerkungen: [] },
  { nummer: 26, semester: 2, von: "2027-03-01", bis: "2027-03-07", hijri: "22.–28. Ramadan 1448", anmerkungen: ["Fr., 05.03.: Kadir-Nacht"] },
  { nummer: 27, semester: 2, von: "2027-03-08", bis: "2027-03-14", hijri: "29. Ramadan – 6. Schawwal 1448", anmerkungen: ["Di., 09.03.: Ramadanfest (1. Tag)", "Mi., 10.03.: Ramadanfest (2. Tag)", "Do., 11.03.: Ramadanfest (3. Tag)", "08.03.: Weltfrauentag", "14.03.: Int. Tag der Mathematik"] },
  { nummer: 28, semester: 2, von: "2027-03-15", bis: "2027-03-21", hijri: "7.–13. Schawwal 1448", anmerkungen: [] },
  { nummer: 29, semester: 2, von: "2027-03-22", bis: "2027-03-28", hijri: "14.–20. Schawwal 1448", anmerkungen: ["Osterferien 20.03. – 29.03.2027", "22.03.: Weltwassertag"] },
  { nummer: 30, semester: 2, von: "2027-03-29", bis: "2027-04-04", hijri: "21.–27. Schawwal 1448", anmerkungen: ["Osterferien 20.03. – 29.03.2027", "29.03.: Ostermontag", "02.04.: Int. Kinderbuchtag"] },
  { nummer: 31, semester: 2, von: "2027-04-05", bis: "2027-04-11", hijri: "28. Schawwal – 4. Dhu l-Qada 1448", anmerkungen: ["06.04.: Int. Tag des Sports", "07.04.: Weltgesundheitstag"] },
  { nummer: 32, semester: 2, von: "2027-04-12", bis: "2027-04-18", hijri: "5.–11. Dhu l-Qada 1448", anmerkungen: [] },
  { nummer: 33, semester: 2, von: "2027-04-19", bis: "2027-04-25", hijri: "12.–18. Dhu l-Qada 1448", anmerkungen: ["23.04.: Welttag des Buches", "23.04.: Girls' Day", "24.04.: Int. Tag des Baumes"] },
  { nummer: 34, semester: 2, von: "2027-04-26", bis: "2027-05-02", hijri: "19.–25. Dhu l-Qada 1448", anmerkungen: ["01.05.: Staatsfeiertag"] },
  { nummer: 35, semester: 2, von: "2027-05-03", bis: "2027-05-09", hijri: "26. Dhu l-Qada – 3. Dhu l-Hidscha 1448", anmerkungen: ["04.05.: Landespatron Hl. Florian", "06.05.: Christi Himmelfahrt", "09.05.: Muttertag"] },
  { nummer: 36, semester: 2, von: "2027-05-10", bis: "2027-05-16", hijri: "4.–10. Dhu l-Hidscha 1448", anmerkungen: ["So., 16.05.: Opferfest (1. Tag)"] },
  { nummer: 37, semester: 2, von: "2027-05-17", bis: "2027-05-23", hijri: "11.–17. Dhu l-Hidscha 1448", anmerkungen: ["Pfingstferien 15.05. – 17.05.2027", "Mo., 17.05.: Opferfest (2. Tag)", "Di., 18.05.: Opferfest (3. Tag)", "Mi., 19.05.: Opferfest (4. Tag)", "17.05.: Pfingstmontag"] },
  { nummer: 38, semester: 2, von: "2027-05-24", bis: "2027-05-30", hijri: "18.–24. Dhu l-Hidscha 1448", anmerkungen: ["27.05.: Fronleichnam"] },
  { nummer: 39, semester: 2, von: "2027-05-31", bis: "2027-06-06", hijri: "25. Dhu l-Hidscha 1448 – 1. Muharram 1449", anmerkungen: ["01.06.: Weltmilchtag", "05.06.: Weltumwelttag", "So., 06.06.: Islamisches Neujahr (Hidschra)"] },
  { nummer: 40, semester: 2, von: "2027-06-07", bis: "2027-06-13", hijri: "2.–8. Muharram 1449", anmerkungen: ["13.06.: Vatertag"] },
  { nummer: 41, semester: 2, von: "2027-06-14", bis: "2027-06-20", hijri: "9.–15. Muharram 1449", anmerkungen: ["20.06.: Weltflüchtlingstag", "Di., 15.06.: 10. Muharram – Aschura-Tag"] },
  { nummer: 42, semester: 2, von: "2027-06-21", bis: "2027-06-27", hijri: "16.–22. Muharram 1449", anmerkungen: ["27.06.: Siebenschläfertag"] },
  { nummer: 43, semester: 2, von: "2027-06-28", bis: "2027-07-04", hijri: "23.–29. Muharram 1449", anmerkungen: ["Sommerferien 03.07. - 05.09.2027"] },
];

const VARIANTE_14_09: JahresplanKalenderWoche[] = [
  { nummer: 1, semester: 1, von: "2026-09-14", bis: "2026-09-20", hijri: "3.–9. Rabi al-Achir 1448", anmerkungen: ["Schulbeginn: 14.09.2026"] },
  { nummer: 2, semester: 1, von: "2026-09-21", bis: "2026-09-27", hijri: "10.–16. Rabi al-Achir 1448", anmerkungen: ["21.09.: Weltfriedenstag", "26.09.: Europäischer Tag der Sprachen"] },
  { nummer: 3, semester: 1, von: "2026-09-28", bis: "2026-10-04", hijri: "17.–23. Rabi al-Achir 1448", anmerkungen: ["04.10.: Welttierschutztag"] },
  { nummer: 4, semester: 1, von: "2026-10-05", bis: "2026-10-11", hijri: "24.–30. Rabi al-Achir 1448", anmerkungen: ["05.10.: Weltlehrertag"] },
  { nummer: 5, semester: 1, von: "2026-10-12", bis: "2026-10-18", hijri: "1.–7. Dschumada al-Ula 1448", anmerkungen: ["16.10.: Welternährungstag"] },
  { nummer: 6, semester: 1, von: "2026-10-19", bis: "2026-10-25", hijri: "8.–14. Dschumada al-Ula 1448", anmerkungen: [] },
  { nummer: 7, semester: 1, von: "2026-10-26", bis: "2026-11-01", hijri: "15.–21. Dschumada al-Ula 1448", anmerkungen: ["Herbstferien 27.10. – 31.10.2026", "26.10.: Nationalfeiertag", "31.10.: Weltspartag", "01.11.: Allerheiligen"] },
  { nummer: 8, semester: 1, von: "2026-11-02", bis: "2026-11-08", hijri: "22.–28. Dschumada al-Ula 1448", anmerkungen: ["02.11.: Allerseelen"] },
  { nummer: 9, semester: 1, von: "2026-11-09", bis: "2026-11-15", hijri: "29. Dschumada al-Ula – 6. Dschumada al-Achira 1448", anmerkungen: ["13.11.: Tag des Apfels"] },
  { nummer: 10, semester: 1, von: "2026-11-16", bis: "2026-11-22", hijri: "7.–13. Dschumada al-Achira 1448", anmerkungen: ["20.11.: Tag der Kinderrechte"] },
  { nummer: 11, semester: 1, von: "2026-11-23", bis: "2026-11-29", hijri: "14.–20. Dschumada al-Achira 1448", anmerkungen: ["29.11.: 1. Adventsonntag"] },
  { nummer: 12, semester: 1, von: "2026-11-30", bis: "2026-12-06", hijri: "21.–27. Dschumada al-Achira 1448", anmerkungen: ["04.12.: Hl. Barbara", "06.12.: Hl. Nikolaus"] },
  { nummer: 13, semester: 1, von: "2026-12-07", bis: "2026-12-13", hijri: "28. Dschumada al-Achira – 4. Radschab 1448", anmerkungen: ["08.12.: Mariä Empfängnis", "Do., 10.12.: Beginn der drei heiligen Monate", "Do., 10.12.: Regaib-Nacht"] },
  { nummer: 14, semester: 1, von: "2026-12-14", bis: "2026-12-20", hijri: "5.–11. Radschab 1448", anmerkungen: [] },
  { nummer: 15, semester: 1, von: "2026-12-21", bis: "2026-12-27", hijri: "12.–18. Radschab 1448", anmerkungen: ["Weihnachtsferien 24.12.2026 – 06.01.2027", "25.12.: Weihnachten", "26.12.: Stephanstag"] },
  { nummer: 16, semester: 1, von: "2026-12-28", bis: "2027-01-03", hijri: "19.–25. Radschab 1448", anmerkungen: ["Weihnachtsferien 24.12.2026 – 06.01.2027"] },
  { nummer: 17, semester: 1, von: "2027-01-04", bis: "2027-01-10", hijri: "26. Radschab – 2. Schaban 1448", anmerkungen: ["Weihnachtsferien 24.12.2026 – 06.01.2027", "06.01.: Heilige Drei Könige", "10.01.: Tag der Blockflöte", "Mo., 04.01.: Miradsch-Nacht"] },
  { nummer: 18, semester: 1, von: "2027-01-11", bis: "2027-01-17", hijri: "3.–9. Schaban 1448", anmerkungen: [] },
  { nummer: 19, semester: 1, von: "2027-01-18", bis: "2027-01-24", hijri: "10.–16. Schaban 1448", anmerkungen: ["24.01.: Welttag der Bildung", "Fr., 22.01.: Berat-Nacht"] },
  { nummer: 20, semester: 1, von: "2027-01-25", bis: "2027-01-31", hijri: "17.–23. Schaban 1448", anmerkungen: ["26.01.: Welttag der Umweltbildung"] },
  { nummer: 21, semester: 1, von: "2027-02-01", bis: "2027-02-07", hijri: "24.–30. Schaban 1448", anmerkungen: [] },
  { nummer: 22, semester: 1, von: "2027-02-08", bis: "2027-02-14", hijri: "1.–7. Ramadan 1448", anmerkungen: ["Mo., 08.02.: Beginn des Ramadan", "09.02.: Safer Internet Day", "09.02.: Faschingsdienstag"] },
  { nummer: 23, semester: 2, von: "2027-02-15", bis: "2027-02-21", hijri: "8.–14. Ramadan 1448", anmerkungen: ["Semesterferien 15.02. - 20.02.2027", "21.02.: Int. Tag der Muttersprache"] },
  { nummer: 24, semester: 2, von: "2027-02-22", bis: "2027-02-28", hijri: "15.–21. Ramadan 1448", anmerkungen: [] },
  { nummer: 25, semester: 2, von: "2027-03-01", bis: "2027-03-07", hijri: "22.–28. Ramadan 1448", anmerkungen: [] },
  { nummer: 26, semester: 2, von: "2027-03-08", bis: "2027-03-14", hijri: "29. Ramadan – 6. Schawwal 1448", anmerkungen: ["Di., 09.03.: Ramadanfest (1. Tag)", "Mi., 10.03.: Ramadanfest (2. Tag)", "Do., 11.03.: Ramadanfest (3. Tag)", "08.03.: Weltfrauentag", "14.03.: Int. Tag der Mathematik"] },
  { nummer: 27, semester: 2, von: "2027-03-15", bis: "2027-03-21", hijri: "7.–13. Schawwal 1448", anmerkungen: [] },
  { nummer: 28, semester: 2, von: "2027-03-22", bis: "2027-03-28", hijri: "14.–20. Schawwal 1448", anmerkungen: ["Osterferien 20.03. – 29.03.2027", "22.03.: Weltwassertag"] },
  { nummer: 29, semester: 2, von: "2027-03-29", bis: "2027-04-04", hijri: "21.–27. Schawwal 1448", anmerkungen: ["Osterferien 20.03. – 29.03.2027", "29.03.: Ostermontag", "02.04.: Int. Kinderbuchtag"] },
  { nummer: 30, semester: 2, von: "2027-04-05", bis: "2027-04-11", hijri: "28. Schawwal – 4. Dhu l-Qada 1448", anmerkungen: ["06.04.: Int. Tag des Sports", "07.04.: Weltgesundheitstag"] },
  { nummer: 31, semester: 2, von: "2027-04-12", bis: "2027-04-18", hijri: "5.–11. Dhu l-Qada 1448", anmerkungen: [] },
  { nummer: 32, semester: 2, von: "2027-04-19", bis: "2027-04-25", hijri: "12.–18. Dhu l-Qada 1448", anmerkungen: ["23.04.: Welttag des Buches", "23.04.: Girls' Day", "24.04.: Int. Tag des Baumes"] },
  { nummer: 33, semester: 2, von: "2027-04-26", bis: "2027-05-02", hijri: "19.–25. Dhu l-Qada 1448", anmerkungen: ["01.05.: Staatsfeiertag"] },
  { nummer: 34, semester: 2, von: "2027-05-03", bis: "2027-05-09", hijri: "26. Dhu l-Qada – 3. Dhu l-Hidscha 1448", anmerkungen: ["04.05.: Landespatron Hl. Florian", "06.05.: Christi Himmelfahrt", "09.05.: Muttertag"] },
  { nummer: 35, semester: 2, von: "2027-05-10", bis: "2027-05-16", hijri: "4.–10. Dhu l-Hidscha 1448", anmerkungen: ["So., 16.05.: Opferfest (1. Tag)"] },
  { nummer: 36, semester: 2, von: "2027-05-17", bis: "2027-05-23", hijri: "11.–17. Dhu l-Hidscha 1448", anmerkungen: ["Pfingstferien 15.05. – 17.05.2027", "Mo., 17.05.: Opferfest (2. Tag)", "Di., 18.05.: Opferfest (3. Tag)", "Mi., 19.05.: Opferfest (4. Tag)", "17.05.: Pfingstmontag"] },
  { nummer: 37, semester: 2, von: "2027-05-24", bis: "2027-05-30", hijri: "18.–24. Dhu l-Hidscha 1448", anmerkungen: ["27.05.: Fronleichnam"] },
  { nummer: 38, semester: 2, von: "2027-05-31", bis: "2027-06-06", hijri: "25. Dhu l-Hidscha 1448 – 1. Muharram 1449", anmerkungen: ["01.06.: Weltmilchtag", "05.06.: Weltumwelttag"] },
  { nummer: 39, semester: 2, von: "2027-06-07", bis: "2027-06-13", hijri: "2.–8. Muharram 1449", anmerkungen: ["13.06.: Vatertag"] },
  { nummer: 40, semester: 2, von: "2027-06-14", bis: "2027-06-20", hijri: "9.–15. Muharram 1449", anmerkungen: ["20.06.: Weltflüchtlingstag", "Di., 15.06.: 10. Muharram – Aschura-Tag"] },
  { nummer: 41, semester: 2, von: "2027-06-21", bis: "2027-06-27", hijri: "16.–22. Muharram 1449", anmerkungen: ["27.06.: Siebenschläfertag"] },
  { nummer: 42, semester: 2, von: "2027-06-28", bis: "2027-07-04", hijri: "23.–29. Muharram 1449", anmerkungen: [] },
  { nummer: 43, semester: 2, von: "2027-07-05", bis: "2027-07-11", hijri: "1.–7. Safar 1449", anmerkungen: ["Sommerferien 10.07. - 12.09.2027"] },
];

export const JAHRESPLAN_KALENDER_VARIANTEN: JahresplanKalenderVariante[] = [
  { id: "2026-09-07", label: "Schulbeginn 07.09.2026", schuljahr: "2026/27", wochen: VARIANTE_07_09 },
  { id: "2026-09-14", label: "Schulbeginn 14.09.2026", schuljahr: "2026/27", wochen: VARIANTE_14_09 },
];

export function holeKalenderVariante(id: string): JahresplanKalenderVariante | null {
  return JAHRESPLAN_KALENDER_VARIANTEN.find((v) => v.id === id) ?? null;
}
