/**
 * Elternbrief-Vorlagen (siehe app/werkzeuge/elternbriefe) - fixer, im Code hinterlegter Text mit
 * {{Platzhaltern}}, KEIN KI-Aufruf: die Lehrkraft füllt die Felder direkt im Browser aus (siehe
 * components/ElternbriefEditor.tsx) und lädt danach das fertige Word-Dokument herunter - statt
 * nur eine leere Vorlage zum manuellen Nachbearbeiten in Word zu bekommen. Bewusst als eigene,
 * kleine Bausteine statt eines generischen "Brief mit KI schreiben"-Formulars - passend zu
 * wiederkehrenden, immer gleichen Anlässen im Schuljahr. Reiner Text/Logik-Teil OHNE docx-Import
 * (siehe lib/elternbriefeDocx.ts für die eigentliche Worderzeugung), damit diese Datei auch aus
 * einer Client-Komponente heraus importierbar bleibt (Live-Vorschau beim Ausfüllen).
 */

export interface ElternbriefFeld {
  id: string;
  label: string;
  platzhalter: string;
}

export interface ElternbriefVorlage {
  id: string;
  titel: string;
  beschreibung: string;
  felder: ElternbriefFeld[];
  /** Fließtext-Absätze mit {{feld.id}}-Platzhaltern - siehe fuelleVorlage. */
  absaetze: string[];
}

// Alle Vorlagen bewusst im österreichischen Schulkontext formuliert: "Erziehungsberechtigte"
// statt nur "Eltern", Schulveranstaltung/Sportlehrkraft als in Österreich gebräuchliche Begriffe,
// und beim Ramadan-Brief EXPLIZIT klargestellt, dass Fasten allein KEINE Befreiung vom
// Bewegungs- und Sportunterricht begründet (verwechslungsgefährdeter Punkt, siehe Kommentar dort).
export const ELTERNBRIEF_VORLAGEN: ElternbriefVorlage[] = [
  {
    id: "ramadan-infobrief",
    titel: "Ramadan-Infobrief an die Eltern",
    beschreibung:
      "Informiert Eltern über den bevorstehenden Ramadan und wie er im Unterricht berücksichtigt wird.",
    felder: [
      { id: "schule", label: "Name der Schule", platzhalter: "z.B. VS Musterstraße" },
      { id: "lehrkraft", label: "Name der Lehrkraft", platzhalter: "z.B. Amina Yılmaz, BEd" },
      { id: "datum", label: "Termin im Unterricht", platzhalter: "z.B. 3. März" },
    ],
    absaetze: [
      "Sehr geehrte Eltern und Erziehungsberechtigte,",
      "in Kürze beginnt der Fastenmonat Ramadan. In dieser Zeit fasten viele muslimische Schüler:innen von der Morgen- bis zur Abenddämmerung. Ich möchte Sie darüber informieren, wie wir im Rahmen des Islamischen Religionsunterrichts damit umgehen.",
      "Ob und ab welchem Alter ein Kind fastet, entscheiden Sie als Familie gemeinsam mit Ihrem Kind - eine Fastenpflicht besteht religiös erst ab der Geschlechtsreife.",
      // Bewusst als eigener, unmissverständlicher Absatz statt nebenbei erwähnt: Fasten ist KEIN
      // Freibrief für eine automatische Befreiung vom Turnunterricht - das wäre eine falsche und
      // in österreichischen Schulen so nicht geltende Selbstverständlichkeit.
      "Wichtig zu wissen: Das Fasten allein ist KEIN Grund für eine Befreiung vom Bewegungs- und Sportunterricht oder anderen Gegenständen - dafür gibt es keine pauschale Regelung. Sollte Ihr Kind während des Fastens gesundheitlich stärker gefordert sein, gilt wie sonst auch der übliche Weg über die jeweilige Fachlehrkraft bzw. ein ärztliches Attest.",
      "Am {{datum}} werden wir im Unterricht besprechen, was der Ramadan bedeutet und welche Werte damit verbunden sind (Selbstdisziplin, Mitgefühl, Dankbarkeit).",
      "Bei Fragen stehe ich Ihnen gerne zur Verfügung.",
      "Mit freundlichen Grüßen",
      "{{lehrkraft}}",
      "{{schule}}",
    ],
  },
  {
    id: "exkursion-einverstaendnis",
    titel: "Einverständniserklärung für eine Exkursion",
    beschreibung: "Vorlage für eine Moschee- oder Museumsexkursion im Rahmen des Religionsunterrichts.",
    felder: [
      { id: "ziel", label: "Ziel der Exkursion", platzhalter: "z.B. Moschee am Hauptplatz" },
      { id: "datum", label: "Datum der Exkursion", platzhalter: "z.B. 14. Mai" },
      { id: "uhrzeit_start", label: "Treffpunkt-Uhrzeit", platzhalter: "z.B. 8:00 Uhr" },
      { id: "uhrzeit_ende", label: "Voraussichtliche Rückkehr", platzhalter: "z.B. 12:30 Uhr" },
      { id: "ausruestung", label: "Mitzubringende Ausrüstung", platzhalter: "z.B. wetterfeste Kleidung, Jause" },
      { id: "abgabe_datum", label: "Abgabefrist für diesen Zettel", platzhalter: "z.B. 7. Mai" },
      { id: "lehrkraft", label: "Name der Lehrkraft", platzhalter: "z.B. Amina Yılmaz, BEd" },
    ],
    absaetze: [
      "Sehr geehrte Eltern und Erziehungsberechtigte,",
      "im Rahmen des Islamischen Religionsunterrichts findet als Schulveranstaltung am {{datum}} ein Ausflug zu {{ziel}} statt. Wir treffen uns um {{uhrzeit_start}} und sind voraussichtlich um {{uhrzeit_ende}} wieder zurück.",
      "Bitte geben Sie Ihrem Kind Folgendes mit: {{ausruestung}}.",
      "Bitte füllen Sie den unteren Abschnitt aus und geben Sie ihn bis spätestens {{abgabe_datum}} Ihrem Kind mit in die Schule.",
      "Mit freundlichen Grüßen",
      "{{lehrkraft}}",
      "",
      "---------------------------------------------",
      "",
      "Ich bin damit einverstanden, dass mein Kind ____________________________ (Name) an der Schulveranstaltung am {{datum}} teilnimmt.",
      "",
      "Datum, Unterschrift der/des Erziehungsberechtigten: ____________________________",
    ],
  },
  {
    id: "schuljahresbeginn",
    titel: "Elterninfo zum Schuljahresbeginn",
    beschreibung: "Allgemeine Vorstellung des Fachs und der Lehrkraft zu Beginn des Schuljahres.",
    felder: [
      { id: "lehrkraft", label: "Name der Lehrkraft", platzhalter: "z.B. Amina Yılmaz, BEd" },
      { id: "wochentag_uhrzeit", label: "Wochentag & Uhrzeit", platzhalter: "z.B. montags, 3. Stunde" },
      { id: "raum", label: "Unterrichtsraum", platzhalter: "z.B. Raum 2.14" },
      { id: "kontakt", label: "Kontaktmöglichkeit", platzhalter: "z.B. über das Klassenbuch/Sekretariat" },
      { id: "schule", label: "Name der Schule", platzhalter: "z.B. VS Musterstraße" },
    ],
    absaetze: [
      "Sehr geehrte Eltern und Erziehungsberechtigte,",
      "mein Name ist {{lehrkraft}} und ich unterrichte Ihr Kind in diesem Schuljahr im Fach Islamischer Religionsunterricht. Der Islamische Religionsunterricht wird in Österreich als ordentlicher Unterrichtsgegenstand in Abstimmung mit der Islamischen Glaubensgemeinschaft in Österreich (IGGÖ) erteilt.",
      "Wir treffen uns {{wochentag_uhrzeit}} in {{raum}}. Im Laufe des Schuljahres beschäftigen wir uns unter anderem mit den Grundlagen des Glaubens, religiösem Handeln, ethischen Fragestellungen und dem Zusammenleben in einer vielfältigen Gesellschaft.",
      "Bei Fragen oder Anliegen erreichen Sie mich {{kontakt}}.",
      "Ich freue mich auf ein gutes Schuljahr mit Ihren Kindern.",
      "Mit freundlichen Grüßen",
      "{{lehrkraft}}",
      "{{schule}}",
    ],
  },
];

export function findeElternbriefVorlage(id: string): ElternbriefVorlage | null {
  return ELTERNBRIEF_VORLAGEN.find((v) => v.id === id) ?? null;
}

/** Islamischer Gruß, den eine Lehrkraft des Islamischen Religionsunterrichts optional vor die
 * formelle deutsche Anrede stellen kann - passend, da alle Vorlagen sich an Eltern von Kindern im
 * Islamischen Religionsunterricht richten. Bewusst NICHT fest eingebaut, sondern über
 * `islamischerGruss` zuschaltbar (siehe fuelleVorlage) - manche Lehrkräfte/Schulen bevorzugen die
 * rein formelle Anrede. */
export const ISLAMISCHER_GRUSS = "As-salamu alaikum wa rahmatullahi wa barakatuh,";

/** Ersetzt {{feld.id}}-Platzhalter durch die eingegebenen Werte - ein leer gelassenes Feld fällt
 * auf "[Label]" zurück (statt eine leere Lücke zu hinterlassen), damit ein unvollständig
 * ausgefüllter Brief beim Download trotzdem klar erkennbar bleibt, was noch fehlt. Liefert den
 * ERSTEN ENTWURF eines Briefs (ein Absatz pro Array-Eintrag) - die Lehrkraft kann diesen Text im
 * Editor danach frei umformulieren, siehe absaetzeZuText/textZuAbsaetze. Rein textbasiert, kein
 * docx-Import - nutzbar sowohl serverseitig (Word-Erzeugung) als auch clientseitig (Editor). */
export function fuelleVorlage(
  vorlage: ElternbriefVorlage,
  werte: Record<string, string>,
  islamischerGruss = false,
): string[] {
  const absaetze = vorlage.absaetze.map((absatz) =>
    vorlage.felder.reduce((text, feld) => {
      const wert = werte[feld.id]?.trim();
      return text.split(`{{${feld.id}}}`).join(wert || `[${feld.label}]`);
    }, absatz),
  );
  return islamischerGruss ? [ISLAMISCHER_GRUSS, "", ...absaetze] : absaetze;
}

/** Wandelt die Absatz-Liste in einen einzigen, frei bearbeitbaren Text um (ein Absatz pro Zeile -
 * genau wie im erzeugten Word-Dokument, siehe lib/elternbriefeDocx.ts) und zurück. Damit kann der
 * Editor den Entwurf als normalen Fließtext in einem Textfeld anzeigen, den die Lehrkraft frei
 * umformulieren kann, statt nur vorgegebene Platzhalter zu füllen. */
export function absaetzeZuText(absaetze: string[]): string {
  return absaetze.join("\n");
}

export function textZuAbsaetze(text: string): string[] {
  return text.split("\n");
}
