import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

/**
 * Elternbrief-Vorlagen (siehe app/werkzeuge/elternbriefe) - statische, editierbare Word-Vorlagen
 * zum Download, KEIN KI-Aufruf: der Text wird hier fix im Code definiert (mit [Platzhaltern] zum
 * selbst Ausfüllen), nicht generiert. Bewusst als eigene, kleine Bausteine statt eines
 * generischen "Brief mit KI schreiben"-Formulars - passend zu wiederkehrenden, immer gleichen
 * Anlässen im Schuljahr.
 */

export interface ElternbriefVorlage {
  id: string;
  titel: string;
  beschreibung: string;
  absaetze: string[]; // Fließtext-Absätze, [PLATZHALTER] werden von der Lehrkraft nach dem Download ersetzt
}

export const ELTERNBRIEF_VORLAGEN: ElternbriefVorlage[] = [
  {
    id: "ramadan-infobrief",
    titel: "Ramadan-Infobrief an die Eltern",
    beschreibung:
      "Informiert Eltern über den bevorstehenden Ramadan und wie er im Unterricht berücksichtigt wird.",
    absaetze: [
      "Sehr geehrte Eltern,",
      "in Kürze beginnt der Fastenmonat Ramadan. In dieser Zeit fasten viele muslimische Schüler:innen von der Morgen- bis zur Abenddämmerung. Ich möchte Sie darüber informieren, wie wir im Rahmen des Islamischen Religionsunterrichts damit umgehen.",
      "Kinder, die fasten möchten, werden dabei unterstützt und nicht zur Teilnahme an sportlichen oder besonders anstrengenden Aktivitäten gedrängt. Ob und ab welchem Alter ein Kind fastet, entscheiden Sie als Eltern gemeinsam mit Ihrem Kind - eine Fastenpflicht besteht erst ab der Geschlechtsreife.",
      "Am [DATUM] werden wir im Unterricht besprechen, was der Ramadan bedeutet und welche Werte damit verbunden sind (Selbstdisziplin, Mitgefühl, Dankbarkeit).",
      "Bei Fragen stehe ich Ihnen gerne zur Verfügung.",
      "Mit freundlichen Grüßen",
      "[NAME DER LEHRKRAFT]",
      "[SCHULE]",
    ],
  },
  {
    id: "exkursion-einverstaendnis",
    titel: "Einverständniserklärung für eine Exkursion",
    beschreibung: "Vorlage für eine Moschee- oder Museumsexkursion im Rahmen des Religionsunterrichts.",
    absaetze: [
      "Sehr geehrte Eltern,",
      "im Rahmen des Islamischen Religionsunterrichts planen wir am [DATUM] einen Ausflug zu [ZIEL DER EXKURSION]. Wir treffen uns um [UHRZEIT] und sind voraussichtlich um [UHRZEIT ENDE] wieder zurück.",
      "Bitte geben Sie Ihrem Kind [AUSRÜSTUNG/HINWEISE, z.B. wetterfeste Kleidung, Jause] mit.",
      "Bitte füllen Sie den unteren Abschnitt aus und geben Sie ihn bis spätestens [DATUM] Ihrem Kind mit in die Schule.",
      "Mit freundlichen Grüßen",
      "[NAME DER LEHRKRAFT]",
      "",
      "---------------------------------------------",
      "",
      "Ich bin damit einverstanden, dass mein Kind ____________________________ (Name) an der Exkursion am [DATUM] teilnimmt.",
      "",
      "Datum, Unterschrift: ____________________________",
    ],
  },
  {
    id: "schuljahresbeginn",
    titel: "Elterninfo zum Schuljahresbeginn",
    beschreibung: "Allgemeine Vorstellung des Fachs und der Lehrkraft zu Beginn des Schuljahres.",
    absaetze: [
      "Sehr geehrte Eltern,",
      "mein Name ist [NAME DER LEHRKRAFT] und ich unterrichte Ihr Kind in diesem Schuljahr im Fach Islamischer Religionsunterricht.",
      "Wir treffen uns [WOCHENTAG/UHRZEIT] in [RAUM]. Im Laufe des Schuljahres beschäftigen wir uns unter anderem mit den Grundlagen des Glaubens, religiösem Handeln, ethischen Fragestellungen und dem Zusammenleben in einer vielfältigen Gesellschaft.",
      "Bei Fragen oder Anliegen erreichen Sie mich unter [KONTAKT].",
      "Ich freue mich auf ein gutes Schuljahr mit Ihren Kindern.",
      "Mit freundlichen Grüßen",
      "[NAME DER LEHRKRAFT]",
      "[SCHULE]",
    ],
  },
];

export function findeElternbriefVorlage(id: string): ElternbriefVorlage | null {
  return ELTERNBRIEF_VORLAGEN.find((v) => v.id === id) ?? null;
}

/** Baut die Vorlage als schlichtes Word-Dokument (Titel + Fließtext-Absätze) - bewusst ohne
 * Layout-Schnickschnack (kein Logo/Muster wie bei den Arbeitsblättern, siehe
 * lib/docx/buildWorksheetDocx.ts), da hier der TEXT selbst die Vorlage ist, die auf dem
 * Schul-Briefpapier der Lehrkraft landen soll. */
export async function renderElternbriefDocxBuffer(vorlage: ElternbriefVorlage): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            children: [new TextRun({ text: vorlage.titel })],
          }),
          ...vorlage.absaetze.map(
            (text) =>
              new Paragraph({
                spacing: { after: 200 },
                children: [new TextRun({ text })],
              }),
          ),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
