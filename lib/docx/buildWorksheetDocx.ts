import fs from "fs";
import path from "path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import { WorksheetContent, LayoutConfig, Aufgabe } from "@/lib/types";
import { formatDoppelDatum } from "@/lib/hijri";
import { ANFORDERUNGSBEREICHE } from "@/lib/curriculum";
import { ICONS, IconKey } from "@/lib/icons";

const WORT_BILD_PFAD = path.join(process.cwd(), "public/patterns/lernen-gold.png");
const WORT_BILD_SEITENVERHAELTNIS = 556 / 452; // Breite/Höhe von public/patterns/lernen-gold.png

function iconPfadDocx(key: IconKey): string {
  return path.join(process.cwd(), `public/icons/${key}.png`);
}

const TYP_LABEL: Record<Aufgabe["typ"], string> = {
  multiple_choice: "Multiple Choice",
  lueckentext: "Lückentext",
  zuordnung: "Zuordnung",
  offene_frage: "Offene Frage",
  wahr_falsch: "Wahr oder Falsch",
  ausmalbild: "Ausmalbild",
  bildergeschichte: "Bildergeschichte",
};

const ACCENT = "0f9d58";

export async function buildWorksheetDocx(
  content: WorksheetContent,
  layout: LayoutConfig,
  themenbereichLabel: string,
  erstelltAm: Date,
): Promise<Buffer> {
  const accentColor = layout.template === "modern" ? ACCENT : "111111";
  const baseSize = layout.schriftgroesse === "gross" ? 26 : 22; // halbe Punkte

  const children: Paragraph[] = [];

  if (layout.schulname) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: layout.schulname, size: baseSize - 2, color: "555555" })],
      }),
    );
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: accentColor },
      },
      children: [new TextRun({ text: content.titel, color: accentColor, bold: true })],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${content.fach} · ${content.schulstufe} · Thema: ${content.thema}`,
          italics: true,
          size: baseSize - 2,
        }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Themenbereich: ${themenbereichLabel}${layout.zeigeIslamischesDatum ? `  ·  ${formatDoppelDatum(erstelltAm)}` : ""}`,
          size: baseSize - 6,
          color: "666666",
        }),
      ],
      spacing: { after: 120 },
    }),
  );

  if (layout.zeigeMuster) {
    children.push(musterDivider());
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Name: _______________________   Klasse: __________   Datum: __________",
          size: baseSize - 2,
        }),
      ],
      spacing: { before: 120, after: 240 },
    }),
  );

  if (layout.zeigeLernziel) {
    children.push(
      sectionHeading("Lernziel", accentColor, baseSize),
      new Paragraph({ children: [new TextRun({ text: content.lernziel, size: baseSize })], spacing: { after: 200 } }),
    );
  }

  children.push(
    sectionHeading("Einleitung", accentColor, baseSize),
    new Paragraph({ children: [new TextRun({ text: content.einleitung, size: baseSize })], spacing: { after: 200 } }),
    sectionHeading("Aufgaben", accentColor, baseSize),
  );

  for (const a of content.aufgaben) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${TYP_LABEL[a.typ]}${a.anforderungsbereich ? `  ·  ${ANFORDERUNGSBEREICHE[a.anforderungsbereich].label}` : ""}`,
            italics: true,
            size: baseSize - 4,
            color: "666666",
          }),
        ],
        spacing: { before: 160 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `${a.nr}. ${a.frage}`, bold: true, size: baseSize })],
      }),
    );
    if (a.typ === "multiple_choice" && a.optionen) {
      a.optionen.forEach((opt, i) => {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            children: [new TextRun({ text: `${String.fromCharCode(97 + i)}) ${opt}`, size: baseSize })],
          }),
        );
      });
    }
    if (a.typ === "zuordnung" && a.zuordnungLinks) {
      a.zuordnungLinks.forEach((left, i) => {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({ text: `${left}   —   ${a.zuordnungRechts?.[i] ?? ""}`, size: baseSize }),
            ],
          }),
        );
      });
    }
    if (a.typ === "lueckentext" && a.wortliste && a.wortliste.length > 0) {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          children: [
            new TextRun({
              text: `Wortliste: ${a.wortliste.join(" · ")}`,
              size: baseSize,
              italics: true,
            }),
          ],
        }),
      );
    }
    if (a.typ === "ausmalbild" && a.bild) {
      const bildHoehe = 130;
      const bildBreite = Math.round(bildHoehe * ICONS[a.bild].seitenverhaeltnis);
      children.push(
        new Paragraph({
          indent: { left: 360 },
          border: {
            top: { style: BorderStyle.DASHED, size: 3, color: "94a3b8", space: 8 },
            bottom: { style: BorderStyle.DASHED, size: 3, color: "94a3b8", space: 8 },
            left: { style: BorderStyle.DASHED, size: 3, color: "94a3b8", space: 8 },
            right: { style: BorderStyle.DASHED, size: 3, color: "94a3b8", space: 8 },
          },
          children: [
            new ImageRun({
              type: "png",
              data: fs.readFileSync(iconPfadDocx(a.bild)),
              transformation: { width: bildBreite, height: bildHoehe },
            }),
          ],
          spacing: { before: 80 },
        }),
      );
    }
    if (a.typ === "bildergeschichte" && a.bildergeschichteSchritte) {
      a.bildergeschichteSchritte.forEach((schritt, i) => {
        const bildHoehe = 60;
        const bildBreite = Math.round(bildHoehe * ICONS[schritt.bild].seitenverhaeltnis);
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: i === 0 ? 100 : 160 },
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true, size: baseSize - 2 }),
              new ImageRun({
                type: "png",
                data: fs.readFileSync(iconPfadDocx(schritt.bild)),
                transformation: { width: bildBreite, height: bildHoehe },
              }),
            ],
          }),
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({ text: schritt.vorlesetext, italics: true, size: baseSize - 2, color: "475569" }),
            ],
          }),
        );
      });
    }
  }

  if (!layout.loesungenSeparat) {
    children.push(sectionHeading("Lösungen", accentColor, baseSize));
    pushLoesungen(children, content, baseSize);
  }

  if (content.quellen.length > 0) {
    children.push(sectionHeading("Quellenangaben", accentColor, baseSize));
    for (const q of content.quellen) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${q.bezeichnung}${q.text ? ` — „${q.text}“` : ""}`,
              size: baseSize - 2,
            }),
          ],
        }),
      );
    }
  }

  const sections = [{ children }];

  if (layout.loesungenSeparat) {
    const loesungChildren: Paragraph[] = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: `${content.titel} — Lösungsblatt`, color: accentColor, bold: true })],
        spacing: { after: 240 },
      }),
    ];
    pushLoesungen(loesungChildren, content, baseSize);
    sections.push({ children: loesungChildren });
  }

  const doc = new Document({ sections });
  return Packer.toBuffer(doc);
}

function sectionHeading(text: string, color: string, baseSize: number): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color, size: baseSize + 4 })],
    spacing: { before: 200, after: 100 },
  });
}

/**
 * Dezentes islamisches Ornament für Word: das Kalligrafie-Wortbild ("تعلّم" - Lernen,
 * religiös unbedenklich) - bewusst ohne Linien/Rahmen, nur das ruhige Wortbild.
 */
function musterDivider(): Paragraph {
  const bildHoehe = 28;
  const bildBreite = Math.round(bildHoehe * WORT_BILD_SEITENVERHAELTNIS);
  const bildDaten = fs.readFileSync(WORT_BILD_PFAD);

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 160 },
    children: [
      new ImageRun({
        type: "png",
        data: bildDaten,
        transformation: { width: bildBreite, height: bildHoehe },
      }),
    ],
  });
}

function pushLoesungen(children: Paragraph[], content: WorksheetContent, baseSize: number) {
  for (const l of content.loesungen) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${l.nr}. ${l.loesung}`, size: baseSize })],
        spacing: { after: 80 },
      }),
    );
  }
}
