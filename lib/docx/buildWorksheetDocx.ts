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
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
} from "docx";
import { WorksheetContent, LayoutConfig, Aufgabe, MusterVariante } from "@/lib/types";
import { formatDoppelDatum } from "@/lib/hijri";
import { ICONS, IconKey } from "@/lib/icons";
import { zuordnungAnzeige } from "@/lib/zuordnung";
import { reihenfolgeAnzeige } from "@/lib/reihenfolge";
import { berechneRaetselZellgroesse } from "@/lib/raetselLayout";

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

/** Feste Icons als Buffer, beim Modul-Laden EINMAL eingelesen - wichtig für Vercel: dort läuft
 * die Route als eigens gebündelte Funktion, deren Dateispur (Node File Trace) NUR Pfade findet,
 * die statisch im Code als Literal erkennbar sind. Ein zur Laufzeit aus einer Variable
 * zusammengesetzter Pfad (`public/icons/${key}.png`) wird nicht erkannt - die PNGs fehlten
 * dadurch im Deployment, `fs.readFileSync` schlug fehl und die Word-Erstellung brach bei JEDEM
 * Arbeitsblatt mit einer Ausmalbild-/Bildergeschichte-Aufgabe mit festem Icon ab. Deshalb hier
 * bewusst zehn ausgeschriebene, statisch erkennbare Aufrufe statt einer Schleife über
 * ICON_KEYS mit Template-String (siehe identischer Fix in lib/pdf/WorksheetPdf.tsx). */
function liesIcon(dateiname: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), "public/icons", dateiname));
}

const ICON_BUFFER: Record<IconKey, Buffer> = {
  halbmond: liesIcon("halbmond.png"),
  stern: liesIcon("stern.png"),
  moschee: liesIcon("moschee.png"),
  laterne: liesIcon("laterne.png"),
  herz: liesIcon("herz.png"),
  buch: liesIcon("buch.png"),
  sonne: liesIcon("sonne.png"),
  wassertropfen: liesIcon("wassertropfen.png"),
  familie: liesIcon("familie.png"),
  teppich: liesIcon("teppich.png"),
};

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
      data: ICON_BUFFER[bild],
      breite: Math.round(bildHoehe * ICONS[bild].seitenverhaeltnis),
    };
  }
  return null;
}

const OHNE_RAHMEN = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

// Docx-Standardseite ist A4 mit 1 Zoll (1440 dxa) Rand auf jeder Seite (siehe
// sectionPageSizeDefaults/sectionMarginDefaults der docx-Bibliothek - hier wird kein eigenes
// `page`/`margin` gesetzt, es gilt also dieser Standard), 20 dxa = 1pt.
const DOCX_INHALT_BREITE_PT = (11906 - 2 * 1440) / 20;

/** Zellgröße für Wortsuche-/Kreuzworträtsel-Tabellen (in dxa) - siehe lib/raetselLayout.ts für
 * die Formel; ein früherer fest verdrahteter Wert (340 dxa unabhängig von der Spaltenzahl) machte
 * kleine Gitter lächerlich klein statt die Seitenbreite sinnvoll auszunutzen. */
function raetselZellgroesseDxa(spalten: number): number {
  const zellgroessePt = berechneRaetselZellgroesse(DOCX_INHALT_BREITE_PT, spalten);
  return Math.round(zellgroessePt * 20);
}

/** Schriftgröße (in Halbpunkten, wie von docx' TextRun.size erwartet) passend zur Zellgröße -
 * gleicher 0,55-Faktor wie bei der Buchstabengröße in WorksheetPdf.tsx/WorksheetView.tsx. */
function raetselSchriftHalbpunkte(spalten: number): number {
  const zellgroessePt = berechneRaetselZellgroesse(DOCX_INHALT_BREITE_PT, spalten);
  return Math.round(zellgroessePt * 0.55 * 2);
}

type KreuzwortZelle = NonNullable<NonNullable<Aufgabe["kreuzwortGitter"]>[number][number]>;

/** Baut eine Word-Tabelle aus einem Buchstabengitter (Wortsuche) - ohne sichtbare Rahmen, nur
 * gleichmäßig breite Zellen mit je einem zentrierten Buchstaben. */
function baueWortsucheTabelle(gitter: string[][]): Table {
  const spalten = gitter[0]?.length ?? 10;
  const zellgroesseDxa = raetselZellgroesseDxa(spalten);
  const schriftgroesse = raetselSchriftHalbpunkte(spalten);
  return new Table({
    width: { size: 0, type: WidthType.AUTO },
    borders: {
      top: OHNE_RAHMEN,
      bottom: OHNE_RAHMEN,
      left: OHNE_RAHMEN,
      right: OHNE_RAHMEN,
      insideHorizontal: OHNE_RAHMEN,
      insideVertical: OHNE_RAHMEN,
    },
    rows: gitter.map(
      (zeile) =>
        new TableRow({
          children: zeile.map(
            (buchstabe) =>
              new TableCell({
                width: { size: zellgroesseDxa, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: buchstabe, size: schriftgroesse })],
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

/** Baut eine Word-Tabelle aus dem Kreuzworträtsel-Gitter: Zellen mit Buchstabe bekommen einen
 * Rahmen und - falls Startpunkt eines Worts - eine kleine Nummer; Zellen ohne Buchstabe bleiben
 * randlos und dunkel eingefärbt (klassische "gesperrte Felder" eines Kreuzworträtsels). Der
 * gespeicherte Lösungsbuchstabe selbst wird NIE gedruckt - die Zelle bleibt zum Ausfüllen leer. */
function baueKreuzwortTabelle(gitter: (KreuzwortZelle | null)[][]): Table {
  const rahmen = { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" };
  const spalten = gitter[0]?.length ?? 10;
  const zellgroesseDxa = raetselZellgroesseDxa(spalten);
  return new Table({
    width: { size: 0, type: WidthType.AUTO },
    borders: {
      top: OHNE_RAHMEN,
      bottom: OHNE_RAHMEN,
      left: OHNE_RAHMEN,
      right: OHNE_RAHMEN,
      insideHorizontal: OHNE_RAHMEN,
      insideVertical: OHNE_RAHMEN,
    },
    rows: gitter.map(
      (zeile) =>
        new TableRow({
          children: zeile.map(
            (zelle) =>
              new TableCell({
                width: { size: zellgroesseDxa, type: WidthType.DXA },
                shading: zelle ? undefined : { fill: "334155" },
                borders: zelle
                  ? { top: rahmen, bottom: rahmen, left: rahmen, right: rahmen }
                  : { top: OHNE_RAHMEN, bottom: OHNE_RAHMEN, left: OHNE_RAHMEN, right: OHNE_RAHMEN },
                children: [
                  new Paragraph({
                    children:
                      zelle?.nummer != null
                        ? [new TextRun({ text: String(zelle.nummer), size: 10 })]
                        : [],
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

/** Baut eine einzeilige Tabelle mit den Kategorie-Spalten bei "sortierkarten" - leere, umrandete
 * Boxen zum Hineinkleben der ausgeschnittenen Kärtchen. */
function baueSortierKategorienTabelle(kategorien: string[], baseSize: number): Table {
  const rahmen = { style: BorderStyle.SINGLE, size: 6, color: "94A3B8" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: kategorien.map(
          (kategorie) =>
            new TableCell({
              borders: { top: rahmen, bottom: rahmen, left: rahmen, right: rahmen },
              margins: { top: 100, bottom: 400, left: 100, right: 100 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: kategorie, bold: true, size: baseSize, color: "64748B" })],
                }),
              ],
            }),
        ),
      }),
    ],
  });
}

/** Baut ein Gitter aus Ausschneide-Kärtchen bei "sortierkarten" (gestrichelter Rand) - drei pro
 * Zeile, letzte Zeile ggf. mit leeren, randlosen Zellen aufgefüllt, damit die Tabelle gültig
 * bleibt. Zeigt NUR den Kartentext, nie die (Lösungs-)Kategorie. */
function baueSortierKartenTabelle(kartenTexte: string[], baseSize: number): Table {
  const rahmen = { style: BorderStyle.DASHED, size: 4, color: "94A3B8" };
  const SPALTEN = 3;
  const zeilen: string[][] = [];
  for (let i = 0; i < kartenTexte.length; i += SPALTEN) {
    zeilen.push(kartenTexte.slice(i, i + SPALTEN));
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: zeilen.map(
      (zeile) =>
        new TableRow({
          children: [
            ...zeile.map(
              (text) =>
                new TableCell({
                  borders: { top: rahmen, bottom: rahmen, left: rahmen, right: rahmen },
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text, size: baseSize })],
                    }),
                  ],
                }),
            ),
            ...Array.from({ length: SPALTEN - zeile.length }, () =>
              new TableCell({
                borders: { top: OHNE_RAHMEN, bottom: OHNE_RAHMEN, left: OHNE_RAHMEN, right: OHNE_RAHMEN },
                children: [new Paragraph({ children: [] })],
              }),
            ),
          ],
        }),
    ),
  });
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
  diskussion: "Diskussionsimpuls",
  wortsuche: "Wortsuche",
  kreuzwortraetsel: "Kreuzworträtsel",
  malaufgabe: "Malaufgabe",
  recherche_auftrag: "Recherche-/Referat-Auftrag",
  bewegungsaufgabe: "Bewegungsaufgabe",
  sortierkarten: "Sortierkarten",
  nachspuruebung: "Nachspurübung",
};

const ACCENT = "0d9488";

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

  const children: (Paragraph | Table)[] = [];

  if (layout.schulname) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: layout.schulname, size: baseSize - 2, color: "555555" })],
      }),
    );
  }

  // Fach/Schulstufe/Thema/Themenbereich sind reine Formular-Metadaten für die Lehrkraft - auf
  // dem Blatt, das Schüler:innen bekommen, haben sie nichts verloren (siehe WorksheetView.tsx
  // für dieselbe Entscheidung im Web-Druck; themenbereichLabel bleibt als Parameter bestehen,
  // wird hier aber bewusst nicht mehr ausgegeben).
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      // Bei aktivem Musterband übernimmt das weiter unten die Trennfunktion zur Namenszeile
      // statt einer zusätzlichen Linie hier (siehe WorksheetView.tsx für dieselbe Entscheidung
      // im Web) - sonst wirkt Linie + Muster nacheinander "doppelt gemoppelt".
      border: layout.zeigeMuster
        ? undefined
        : { bottom: { style: BorderStyle.SINGLE, size: 6, color: accentColor } },
      children: [new TextRun({ text: content.titel, color: accentColor, bold: true })],
      spacing: { after: 120 },
    }),
  );
  if (layout.zeigeIslamischesDatum) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: formatDoppelDatum(erstelltAm),
            size: baseSize - 6,
            color: "666666",
          }),
        ],
        spacing: { after: 120 },
      }),
    );
  }

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
  );

  // ausgabeform "text" (siehe koranVerse in lib/types.ts, buildKoranTextContent in
  // lib/quranApi.ts) - reiner Vers-Wortlaut ohne Aufgaben. rightToLeft/bidirectional lassen Word
  // den arabischen Text rechtsbündig und in korrekter Leserichtung darstellen; anders als bei der
  // PDF-Ausgabe (siehe WorksheetPdf.tsx) braucht es dafür keine eingebettete Schriftart - Word
  // übernimmt die Komplexschrift-Darstellung über die auf dem lesenden Gerät installierten
  // Schriften selbst.
  if (content.koranVerse && content.koranVerse.length > 0) {
    for (const v of content.koranVerse) {
      children.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { before: 160 },
          children: [new TextRun({ text: v.arabisch, rightToLeft: true, size: baseSize + 10 })],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: v.deutsch, size: baseSize })],
        }),
      );
    }
  }

  if (content.aufgaben.length > 0) {
  children.push(sectionHeading("Aufgaben", accentColor, baseSize));
  for (const a of content.aufgaben) {
    // AFB-Angabe ("Reproduktion"/"Transfer"/...) ist Lehrkraft-Jargon und würde Schüler:innen
    // nur irritieren - bewusst nicht mit auf dem Blatt (siehe gleiche Entscheidung in
    // WorksheetPdf.tsx/WorksheetView.tsx).
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: TYP_LABEL[a.typ],
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
        children: [
          new TextRun({ text: `${a.nr}. ${a.frage}`, bold: true, size: baseSize }),
          ...(a.punkte !== undefined
            ? [new TextRun({ text: ` (${a.punkte} P.)`, size: baseSize, color: "666666" })]
            : []),
        ],
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
      // Kästchen NACH dem Text statt davor (anders als bei "reihenfolge" weiter unten) - man
      // liest erst links das Item, dann rechts die passende Beschreibung, und trägt den
      // Buchstaben erst danach ein.
      zuordnung.links.forEach((l) => {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({ text: `${l.nummer}. ${l.text}  `, size: baseSize }),
              new TextRun({ text: "[   ]", size: baseSize }),
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
    if (a.typ === "diskussion") {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          children: [
            new TextRun({
              text: "Mündliche Diskussion in der Klasse - kein schriftliches Ergebnis nötig.",
              size: baseSize - 2,
              italics: true,
              color: "94A3B8",
            }),
          ],
        }),
      );
    }
    if (a.typ === "wortsuche" && a.wortsucheGitter) {
      children.push(
        new Paragraph({ indent: { left: 360 }, children: [], spacing: { after: 60 } }),
        baueWortsucheTabelle(a.wortsucheGitter),
      );
      if (a.wortsucheWoerter && a.wortsucheWoerter.length > 0) {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: 120 },
            children: [
              new TextRun({
                text: `Gesuchte Wörter: ${a.wortsucheWoerter.join(" · ")}`,
                size: baseSize,
              }),
            ],
          }),
        );
      }
    }
    if (a.typ === "kreuzwortraetsel" && a.kreuzwortGitter) {
      children.push(
        new Paragraph({ indent: { left: 360 }, children: [], spacing: { after: 60 } }),
        baueKreuzwortTabelle(a.kreuzwortGitter),
      );
      if (a.kreuzwortWaagerecht && a.kreuzwortWaagerecht.length > 0) {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: 160 },
            children: [new TextRun({ text: "Waagerecht", bold: true, size: baseSize })],
          }),
        );
        a.kreuzwortWaagerecht.forEach((w) => {
          children.push(
            new Paragraph({
              indent: { left: 360 },
              children: [new TextRun({ text: `${w.nummer}. ${w.hinweis}`, size: baseSize })],
            }),
          );
        });
      }
      if (a.kreuzwortSenkrecht && a.kreuzwortSenkrecht.length > 0) {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: 120 },
            children: [new TextRun({ text: "Senkrecht", bold: true, size: baseSize })],
          }),
        );
        a.kreuzwortSenkrecht.forEach((w) => {
          children.push(
            new Paragraph({
              indent: { left: 360 },
              children: [new TextRun({ text: `${w.nummer}. ${w.hinweis}`, size: baseSize })],
            }),
          );
        });
      }
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
    if (a.typ === "malaufgabe") {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          border: {
            top: { style: BorderStyle.DASHED, size: 3, color: "94a3b8", space: 8 },
            bottom: { style: BorderStyle.DASHED, size: 3, color: "94a3b8", space: 8 },
            left: { style: BorderStyle.DASHED, size: 3, color: "94a3b8", space: 8 },
            right: { style: BorderStyle.DASHED, size: 3, color: "94a3b8", space: 8 },
          },
          spacing: { before: 80, after: 80 },
          children: [new TextRun({ text: " ", size: baseSize })],
        }),
        // Leere Zeilen statt eines festen Bild-Platzhalters, damit im Rahmen sichtbar Platz zum
        // Zeichnen bleibt (Word kennt keine feste Rahmenhöhe wie PDF/Web).
        new Paragraph({ children: [], spacing: { after: 80 } }),
        new Paragraph({ children: [], spacing: { after: 80 } }),
        new Paragraph({ children: [], spacing: { after: 80 } }),
      );
    }
    if (a.typ === "recherche_auftrag") {
      if (a.leitfaden && a.leitfaden.length > 0) {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: 80 },
            children: [new TextRun({ text: "Leitfaden", bold: true, size: baseSize })],
          }),
        );
        a.leitfaden.forEach((punkt, i) => {
          children.push(
            new Paragraph({
              indent: { left: 360 },
              children: [new TextRun({ text: `${i + 1}. ${punkt}`, size: baseSize })],
            }),
          );
        });
      }
      if (a.bewertungskriterien && a.bewertungskriterien.length > 0) {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: 120 },
            children: [new TextRun({ text: "Darauf wird geachtet", bold: true, size: baseSize })],
          }),
        );
        a.bewertungskriterien.forEach((kriterium) => {
          children.push(
            new Paragraph({
              indent: { left: 360 },
              children: [new TextRun({ text: `• ${kriterium}`, size: baseSize })],
            }),
          );
        });
      }
      if (a.quellenhinweis) {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: 80 },
            children: [
              new TextRun({
                text: `Hinweis zu Quellen: ${a.quellenhinweis}`,
                italics: true,
                size: baseSize,
                color: "475569",
              }),
            ],
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
    if (a.typ === "bewegungsaufgabe" && a.bewegungsElemente && a.bewegungsElemente.length > 0) {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { before: 60 },
          children: [
            new TextRun({
              text: "Nacheinander vorlesen - Auflösung, bei welchen Begriffen reagiert werden soll, siehe Lösungsblatt.",
              italics: true,
              size: baseSize - 2,
              color: "94A3B8",
            }),
          ],
        }),
      );
      a.bewegungsElemente.forEach((element) => {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            children: [new TextRun({ text: `• ${element}`, size: baseSize })],
          }),
        );
      });
    }
    if (a.typ === "sortierkarten" && a.sortierKategorien && a.sortierKarten) {
      children.push(baueSortierKategorienTabelle(a.sortierKategorien, baseSize));
      children.push(
        new Paragraph({ indent: { left: 360 }, children: [], spacing: { before: 100, after: 60 } }),
        baueSortierKartenTabelle(
          a.sortierKarten.map((k) => k.text),
          baseSize,
        ),
      );
    }
    if (a.typ === "nachspuruebung" && a.nachspurText) {
      [0, 1, 2].forEach((i) => {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: i === 0 ? 100 : 200 },
            border: { bottom: { style: BorderStyle.DOTTED, size: 4, color: "94A3B8" } },
            children: [
              new TextRun({ text: a.nachspurText, size: baseSize + 14, color: "CBD5E1", characterSpacing: 40 }),
            ],
          }),
        );
      });
    }
  }
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

  // Lösungen erscheinen bewusst NIE auf dem Arbeitsblatt selbst - immer in einer eigenen,
  // separaten Dokument-Section, damit sie nicht versehentlich mit an Schüler:innen geht. Bei
  // reinem Koran-Text (ausgabeform "text", siehe koranVerse oben) gibt es keine Aufgaben/
  // Lösungen - die ganze Lösungsblatt-Section entfällt dann.
  if (content.loesungen.length > 0) {
    const loesungChildren: (Paragraph | Table)[] = [];
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

function pushLoesungen(children: (Paragraph | Table)[], content: WorksheetContent, baseSize: number) {
  for (const l of content.loesungen) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${l.nr}. ${l.loesung}`, size: baseSize })],
        spacing: { after: 80 },
      }),
    );
  }
}
