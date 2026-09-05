import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  VerticalAlign,
  ShadingType,
} from "docx";
import type { JahresplanKalenderWoche } from "./jahresplanKalender";
import type { JahresplanWocheZeile } from "./jahresplan";
import { formatWochenDatum } from "./jahresplan";

const RAND = { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" };
const ZELLE_RAND = { top: RAND, bottom: RAND, left: RAND, right: RAND };
const KOPF_SCHATTIERUNG = { type: ShadingType.SOLID, color: "0F766E", fill: "0F766E" };

function kopfZelle(text: string, breite: number): TableCell {
  return new TableCell({
    width: { size: breite, type: WidthType.PERCENTAGE },
    borders: ZELLE_RAND,
    shading: KOPF_SCHATTIERUNG,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18 })],
      }),
    ],
  });
}

function textZelle(text: string, breite: number, optionen?: { bold?: boolean; groesse?: number }): TableCell {
  const zeilen = text.split("\n");
  return new TableCell({
    width: { size: breite, type: WidthType.PERCENTAGE },
    borders: ZELLE_RAND,
    verticalAlign: VerticalAlign.TOP,
    children: zeilen.map(
      (zeile) =>
        new Paragraph({
          children: [
            new TextRun({ text: zeile, bold: optionen?.bold, size: optionen?.groesse ?? 18 }),
          ],
        }),
    ),
  });
}

function semesterZeile(nummer: 1 | 2): TableRow {
  return new TableRow({
    tableHeader: false,
    children: [
      new TableCell({
        columnSpan: 5,
        shading: { type: ShadingType.SOLID, color: "F0FDFA", fill: "F0FDFA" },
        borders: ZELLE_RAND,
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: `${nummer}. Semester`, bold: true, color: "0F766E", size: 20 }),
            ],
          }),
        ],
      }),
    ],
  });
}

/** Baut die Jahresplanung als Word-Dokument, im Aufbau an die offizielle Vorlage des
 * IGGÖ-Schulamts angelehnt (Kopf-Angaben + Wochentabelle mit Semester-Trennzeilen). Nimmt die
 * Kalenderwochen (Datum/Hijri/Anmerkung, siehe lib/jahresplanKalender.ts) und die von der
 * Lehrkraft eingetragenen Wochenzeilen (siehe lib/jahresplan.ts) getrennt entgegen und führt sie
 * hier erst zusammen - beide Quellen bleiben so unabhängig testbar. */
export async function renderJahresplanDocxBuffer(
  kopf: {
    gruppe: string;
    erstelltVon: string | null;
    bemerkungenGruppe: string | null;
    speziellerFokus: string | null;
    schuljahr: string;
  },
  kalenderWochen: JahresplanKalenderWoche[],
  eintraege: Map<number, JahresplanWocheZeile>,
): Promise<Buffer> {
  const zeilen: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        kopfZelle("Woche", 8),
        kopfZelle("Datum / Hijri", 20),
        kopfZelle("Wochenthema", 24),
        kopfZelle("Kompetenzen", 20),
        kopfZelle("Anmerkung / Notizen danach", 28),
      ],
    }),
  ];

  let laufendesSemester = 0;
  for (const woche of kalenderWochen) {
    if (woche.semester !== laufendesSemester) {
      laufendesSemester = woche.semester;
      zeilen.push(semesterZeile(woche.semester));
    }
    const eintrag = eintraege.get(woche.nummer);
    const anmerkungUndNotizen = [
      ...woche.anmerkungen,
      ...(eintrag?.notizen ? ["", "Notizen: " + eintrag.notizen] : []),
    ].join("\n");

    zeilen.push(
      new TableRow({
        children: [
          textZelle(String(woche.nummer), 8, { bold: true }),
          textZelle(`${formatWochenDatum(woche.von, woche.bis)}\n${woche.hijri}`, 20),
          textZelle(eintrag?.wochenthema ?? "", 24),
          textZelle(eintrag?.kompetenzen ?? "", 20),
          textZelle(anmerkungUndNotizen || "", 28),
        ],
      }),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: { page: { size: { orientation: "landscape" as const } } },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "Islamischer Religionsunterricht - Jahresplanung" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: `Schuljahr ${kopf.schuljahr}`, italics: true })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Religionsunterrichtsgruppe: ", bold: true }),
              new TextRun({ text: kopf.gruppe }),
            ],
          }),
          ...(kopf.erstelltVon
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Erstellt von: ", bold: true }),
                    new TextRun({ text: kopf.erstelltVon }),
                  ],
                }),
              ]
            : []),
          ...(kopf.bemerkungenGruppe
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Bemerkungen zur Gruppe: ", bold: true }),
                    new TextRun({ text: kopf.bemerkungenGruppe }),
                  ],
                }),
              ]
            : []),
          ...(kopf.speziellerFokus
            ? [
                new Paragraph({
                  spacing: { after: 200 },
                  children: [
                    new TextRun({ text: "Spezieller Fokus: ", bold: true }),
                    new TextRun({ text: kopf.speziellerFokus }),
                  ],
                }),
              ]
            : [new Paragraph({ spacing: { after: 200 }, children: [] })]),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: zeilen,
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
