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
  TableLayoutType,
} from "docx";
import type { JahresplanKalenderWoche } from "./jahresplanKalender";
import type { JahresplanWocheZeile } from "./jahresplan";
import { formatWochenDatum } from "./jahresplan";

const RAND = { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" };
const ZELLE_RAND = { top: RAND, bottom: RAND, left: RAND, right: RAND };
const KOPF_SCHATTIERUNG = { type: ShadingType.SOLID, color: "0F766E", fill: "0F766E" };

// Satzspiegelbreite bei A4 quer (Landscape) abzüglich der Standard-Seitenränder (je 1440 Twips =
// 1 Zoll links/rechts - siehe sections[0].properties, wo keine eigenen Ränder gesetzt werden,
// also die docx.js-Standardränder gelten). WICHTIG: eine Tabelle OHNE explizites "columnWidths"
// am Table-Konstruktor bekommt von docx.js für JEDE Spalte nur 100 Twips (≈1,8mm) im <w:tblGrid>
// - die pro Zelle gesetzte Breite (vorher als Prozentwert) betrifft nur den "tcW"-Hinweis, den
// nicht jeder Word-Betrachter beim ersten Öffnen respektiert. Genau das führte dazu, dass die
// Tabelle in Apple Pages/Vorschau (die sich strikt an <w:tblGrid> hält) mit hauchdünnen Spalten
// öffnete, in denen jedes Wort einzelbuchstabenweise umbrach. Explizite Breiten in Twips (DXA)
// UND "layout: FIXED" (siehe unten) erzwingen die Spaltenbreiten unabhängig vom jeweiligen Viewer.
const SEITENBREITE_QUER_TWIPS = 16838;
const SEITENRAND_TWIPS = 1440;
const SATZSPIEGEL_BREITE_TWIPS = SEITENBREITE_QUER_TWIPS - 2 * SEITENRAND_TWIPS;
// Reihenfolge/Anteile entsprechen den 5 Spalten: Woche, Datum/Hijri, Wochenthema, Kompetenzen,
// Anmerkung/Notizen - Summe 1.
const SPALTEN_ANTEILE = [0.08, 0.2, 0.24, 0.2, 0.28] as const;
const SPALTEN_BREITEN_TWIPS = SPALTEN_ANTEILE.map((anteil) =>
  Math.round(SATZSPIEGEL_BREITE_TWIPS * anteil),
);

function kopfZelle(text: string, breiteTwips: number): TableCell {
  return new TableCell({
    width: { size: breiteTwips, type: WidthType.DXA },
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

function textZelle(
  text: string,
  breiteTwips: number,
  optionen?: { bold?: boolean; groesse?: number },
): TableCell {
  const zeilen = text.split("\n");
  return new TableCell({
    width: { size: breiteTwips, type: WidthType.DXA },
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
        kopfZelle("Woche", SPALTEN_BREITEN_TWIPS[0]),
        kopfZelle("Datum / Hijri", SPALTEN_BREITEN_TWIPS[1]),
        kopfZelle("Wochenthema", SPALTEN_BREITEN_TWIPS[2]),
        kopfZelle("Kompetenzen", SPALTEN_BREITEN_TWIPS[3]),
        kopfZelle("Anmerkung / Notizen danach", SPALTEN_BREITEN_TWIPS[4]),
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
          textZelle(String(woche.nummer), SPALTEN_BREITEN_TWIPS[0], { bold: true }),
          textZelle(
            `${formatWochenDatum(woche.von, woche.bis)}\n${woche.hijri}`,
            SPALTEN_BREITEN_TWIPS[1],
          ),
          textZelle(eintrag?.wochenthema ?? "", SPALTEN_BREITEN_TWIPS[2]),
          textZelle(eintrag?.kompetenzen ?? "", SPALTEN_BREITEN_TWIPS[3]),
          textZelle(anmerkungUndNotizen || "", SPALTEN_BREITEN_TWIPS[4]),
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
            columnWidths: [...SPALTEN_BREITEN_TWIPS],
            layout: TableLayoutType.FIXED,
            rows: zeilen,
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
