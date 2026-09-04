import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

/** Baut einen ausgefüllten Elternbrief als schlichtes Word-Dokument (Titel + Fließtext-Absätze) -
 * bewusst ohne Layout-Schnickschnack (kein Logo/Muster wie bei den Arbeitsblättern, siehe
 * lib/docx/buildWorksheetDocx.ts), da hier der TEXT selbst die Vorlage ist, die auf dem
 * Schul-Briefpapier der Lehrkraft landen soll. Eigene Datei getrennt von lib/elternbriefe.ts,
 * damit der docx-Import (server-only) nicht in den Client-Bundle der Live-Vorschau
 * (components/ElternbriefEditor.tsx) mitgezogen wird. */
export async function renderElternbriefDocxBuffer(titel: string, absaetze: string[]): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            children: [new TextRun({ text: titel })],
          }),
          ...absaetze.map(
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
