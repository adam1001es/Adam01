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
import { WorksheetContent, LayoutConfig, Aufgabe, MusterVariante } from "@/lib/types";
import { formatDoppelDatum } from "@/lib/hijri";
import { ANFORDERUNGSBEREICHE } from "@/lib/curriculum";
import { ICONS, IconKey } from "@/lib/icons";
import { zuordnungAnzeige } from "@/lib/zuordnung";
import { reihenfolgeAnzeige } from "@/lib/reihenfolge";

// Jede public/patterns/leiste-*.png ist eine einmalig serverseitig gerenderte Ansicht des
// jeweiligen Vektor-Streifens (lib/patternStrip.ts) - fix auf die bekannte Satzspiegelbreite
// (A4, Standard-Ränder) zugeschnitten, da Word (anders als Web/PDF) nicht responsiv auf
// Vektor-Ebene skaliert. Alle auf dasselbe Seitenverhältnis gerendert.
const MUSTERSTREIFEN_BILD_PFADE: Record<MusterVariante, string> = {
  sterne: path.join(process.cwd(), "public/patterns/leiste-sterne.png"),
  halbmond: path.join(process.cwd(), "public/patterns/leiste-halbmond.png"),
  stern12: path.join(process.cwd(), "public/patterns/leiste-stern12.png"),
};
const MUSTERSTREIFEN_BILD_SEITENVERHAELTNIS = 1740 / 84;

/**
 * Über die volle Satzspiegelbreite verlaufender Zierstreifen - fließt normal mit dem Text statt
 * frei positioniert zu sein, damit er nie mit Titel/Text kollidieren kann. Word bekommt (anders
 * als Web/PDF) nie einen farbigen Kopfbereich-Hintergrund, daher reicht hier immer die dunkle
 * Bildvariante.
 */
function musterDivider(variante: MusterVariante): Paragraph {
  const bildBreite = 580;
  const bildHoehe = Math.round(bildBreite / MUSTERSTREIFEN_BILD_SEITENVERHAELTNIS);
  const bildDaten = fs.readFileSync(MUSTERSTREIFEN_BILD_PFADE[variante]);

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

function iconPfadDocx(key: IconKey): string {
  return path.join(process.cwd(), `public/icons/${key}.png`);
}

/** Liefert die Bilddaten + passende Breite für ein festes Icon oder ein live per Bild-KI
 * generiertes, sicherheitsgeprüftes Motiv (genau eines der beiden ist gesetzt). Generierte
 * Bilder sind quadratisch (768x768), brauchen also kein Seitenverhältnis. */
function bildFuerDocx(
  bild: IconKey | undefined,
  bildGeneriertId: string | undefined,
  generierteBilder: Record<string, Buffer>,
  bildHoehe: number,
): { data: Buffer; breite: number } | null {
  if (bildGeneriertId && generierteBilder[bildGeneriertId]) {
    return { data: generierteBilder[bildGeneriertId], breite: bildHoehe };
  }
  if (bild) {
    return {
      data: fs.readFileSync(iconPfadDocx(bild)),
      breite: Math.round(bildHoehe * ICONS[bild].seitenverhaeltnis),
    };
  }
  return null;
}

const TYP_LABEL: Record<Aufgabe["typ"], string> = {
  multiple_choice: "Multiple Choice",
  lueckentext: "Lückentext",
  zuordnung: "Zuordnung",
  offene_frage: "Offene Frage",
  wahr_falsch: "Wahr oder Falsch",
  ausmalbild: "Ausmalbild",
  bildergeschichte: "Bildergeschichte",
  reihenfolge: "Reihenfolge",
  lesetext: "Lesetext",
};

const ACCENT = "0f9d58";

export async function buildWorksheetDocx(
  content: WorksheetContent,
  layout: LayoutConfig,
  themenbereichLabel: string,
  erstelltAm: Date,
  generierteBilder: Record<string, Buffer> = {},
): Promise<Buffer> {
  const istSchwarzweiss = layout.farbmodus === "schwarzweiss";
  const accentColor = layout.template === "modern" && !istSchwarzweiss ? ACCENT : "111111";
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
    children.push(musterDivider(layout.musterVariante));
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: layout.zeigeIslamischesDatum
            ? "Name: _______________________   Klasse: __________"
            : "Name: _______________________   Klasse: __________   Datum: __________",
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
    );
    if (a.typ === "lesetext" && a.lesetext) {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          shading: { fill: "F8FAFC" },
          children: [new TextRun({ text: a.lesetext, italics: true, size: baseSize, color: "475569" })],
        }),
      );
    }
    children.push(
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
    const zuordnung = a.typ === "zuordnung" ? zuordnungAnzeige(a) : null;
    if (zuordnung) {
      zuordnung.links.forEach((l) => {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({ text: "[   ]  ", size: baseSize }),
              new TextRun({ text: `${l.nummer}. ${l.text}`, size: baseSize }),
            ],
          }),
        );
      });
      zuordnung.rechts.forEach((r) => {
        children.push(
          new Paragraph({
            indent: { left: 720 },
            children: [new TextRun({ text: `${r.buchstabe}) ${r.text}`, size: baseSize, color: "666666" })],
          }),
        );
      });
    }
    const reihenfolge = a.typ === "reihenfolge" ? reihenfolgeAnzeige(a) : null;
    if (reihenfolge) {
      reihenfolge.forEach((text) => {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({ text: "[   ]  ", size: baseSize }),
              new TextRun({ text, size: baseSize }),
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
    if (a.typ === "ausmalbild" && (a.bild || a.bildGeneriertId)) {
      const bildHoehe = 130;
      const bild = bildFuerDocx(a.bild, a.bildGeneriertId, generierteBilder, bildHoehe);
      if (bild) {
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
                data: bild.data,
                transformation: { width: bild.breite, height: bildHoehe },
              }),
            ],
            spacing: { before: 80 },
          }),
        );
      }
    }
    if (a.typ === "bildergeschichte" && a.bildergeschichteSchritte) {
      a.bildergeschichteSchritte.forEach((schritt, i) => {
        const bildHoehe = 60;
        const bild = bildFuerDocx(schritt.bild, schritt.bildGeneriertId, generierteBilder, bildHoehe);
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: i === 0 ? 100 : 160 },
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true, size: baseSize - 2 }),
              ...(bild
                ? [
                    new ImageRun({
                      type: "png",
                      data: bild.data,
                      transformation: { width: bild.breite, height: bildHoehe },
                    }),
                  ]
                : []),
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
    const loesungChildren: Paragraph[] = [];
    loesungChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: `${content.titel} — Lösungsblatt`, color: accentColor, bold: true })],
        spacing: { after: 240 },
      }),
    );
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
