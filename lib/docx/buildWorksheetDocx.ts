import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import { WorksheetContent, LayoutConfig, Aufgabe } from "@/lib/types";
import { formatDoppelDatum } from "@/lib/hijri";

const TYP_LABEL: Record<Aufgabe["typ"], string> = {
  multiple_choice: "Multiple Choice",
  lueckentext: "Lückentext",
  zuordnung: "Zuordnung",
  offene_frage: "Offene Frage",
  wahr_falsch: "Wahr oder Falsch",
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
    children.push(musterDivider(accentColor, baseSize));
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
        children: [new TextRun({ text: TYP_LABEL[a.typ], italics: true, size: baseSize - 4, color: "666666" })],
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

/** Einfache, textbasierte Annäherung an das geometrische Sternmuster (Word erlaubt kein Vektor-Muster ohne Bild-Asset). */
function musterDivider(color: string, baseSize: number): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: Array(14).fill("✦").join("  "),
        color,
        size: baseSize - 8,
      }),
    ],
    spacing: { after: 120 },
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
