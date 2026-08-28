import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { WorksheetContent, LayoutConfig, Aufgabe } from "@/lib/types";
import { formatDoppelDatum } from "@/lib/hijri";
import { ANFORDERUNGSBEREICHE } from "@/lib/curriculum";
import { IslamicPatternStripPdf } from "./IslamicPatternStripPdf";

const TYP_LABEL: Record<Aufgabe["typ"], string> = {
  multiple_choice: "Multiple Choice",
  lueckentext: "Lückentext",
  zuordnung: "Zuordnung",
  offene_frage: "Offene Frage",
  wahr_falsch: "Wahr oder Falsch",
};

function buildStyles(layout: LayoutConfig) {
  const baseFontSize = layout.schriftgroesse === "gross" ? 13 : 11;
  const isKompakt = layout.template === "kompakt";
  const isModern = layout.template === "modern";
  const fontFamily = isModern || isKompakt ? "Helvetica" : "Times-Roman";
  const headerColor = isModern ? "#0f9d58" : "#111111";

  return StyleSheet.create({
    page: {
      fontFamily,
      fontSize: baseFontSize,
      padding: isKompakt ? 24 : 40,
      color: "#1a1a1a",
      lineHeight: 1.4,
    },
    headerBar: {
      backgroundColor: isModern ? headerColor : "transparent",
      color: isModern ? "#ffffff" : "#111111",
      padding: isModern ? 12 : 0,
      marginBottom: isKompakt ? 10 : 18,
      borderBottom: isModern ? undefined : "2px solid #111111",
      paddingBottom: isModern ? 12 : 8,
    },
    schulname: {
      fontSize: baseFontSize - 1,
      marginBottom: 4,
      opacity: 0.85,
    },
    titel: {
      fontSize: baseFontSize + 8,
      fontWeight: 700,
      marginBottom: 4,
    },
    metaZeile: {
      fontSize: baseFontSize - 1,
      opacity: 0.9,
    },
    metaZeile2: {
      fontSize: baseFontSize - 3,
      opacity: 0.75,
      marginTop: 2,
    },
    musterStreifen: {
      marginTop: isModern ? 0 : 8,
      marginBottom: isKompakt ? 8 : 14,
    },
    nameZeile: {
      marginTop: isKompakt ? 6 : 12,
      marginBottom: isKompakt ? 10 : 16,
      fontSize: baseFontSize - 1,
    },
    sectionTitel: {
      fontSize: baseFontSize + 2,
      fontWeight: 700,
      marginTop: 14,
      marginBottom: 6,
      color: isModern ? headerColor : "#111111",
    },
    einleitung: {
      marginBottom: 10,
    },
    aufgabe: {
      marginBottom: isKompakt ? 8 : 14,
    },
    aufgabeKopf: {
      fontWeight: 700,
      marginBottom: 3,
    },
    aufgabeTyp: {
      fontSize: baseFontSize - 2,
      opacity: 0.7,
      marginBottom: 3,
    },
    option: {
      marginLeft: 12,
      marginBottom: 2,
    },
    zuordnungRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginLeft: 12,
      marginBottom: 2,
    },
    quelle: {
      marginBottom: 4,
      fontSize: baseFontSize - 1,
    },
  });
}

function Header({
  content,
  layout,
  themenbereichLabel,
  erstelltAm,
}: {
  content: WorksheetContent;
  layout: LayoutConfig;
  themenbereichLabel: string;
  erstelltAm: Date;
}) {
  const styles = buildStyles(layout);
  return (
    <View style={styles.headerBar}>
      {layout.schulname ? <Text style={styles.schulname}>{layout.schulname}</Text> : null}
      <Text style={styles.titel}>{content.titel}</Text>
      <Text style={styles.metaZeile}>
        {content.fach} · {content.schulstufe} · Thema: {content.thema}
      </Text>
      <Text style={styles.metaZeile2}>
        Themenbereich: {themenbereichLabel}
        {layout.zeigeIslamischesDatum ? `  ·  ${formatDoppelDatum(erstelltAm)}` : ""}
      </Text>
    </View>
  );
}

function MusterStreifen({ layout }: { layout: LayoutConfig }) {
  const styles = buildStyles(layout);
  if (!layout.zeigeMuster) return null;
  const isModern = layout.template === "modern";
  const isKompakt = layout.template === "kompakt";
  const farbe = isModern ? "#0e6b4a" : isKompakt ? "#8a8474" : "#9c7a2c";
  return (
    <View style={styles.musterStreifen}>
      <IslamicPatternStripPdf color={farbe} />
    </View>
  );
}

function NameZeile({ layout }: { layout: LayoutConfig }) {
  const styles = buildStyles(layout);
  return <Text style={styles.nameZeile}>Name: _______________________  Klasse: __________  Datum: __________</Text>;
}

function AufgabenListe({
  content,
  layout,
}: {
  content: WorksheetContent;
  layout: LayoutConfig;
}) {
  const styles = buildStyles(layout);
  return (
    <View>
      <Text style={styles.sectionTitel}>Aufgaben</Text>
      {content.aufgaben.map((a) => (
        <View key={a.nr} style={styles.aufgabe} wrap={false}>
          <Text style={styles.aufgabeTyp}>
            {TYP_LABEL[a.typ]}
            {a.anforderungsbereich ? `  ·  ${ANFORDERUNGSBEREICHE[a.anforderungsbereich].label}` : ""}
          </Text>
          <Text style={styles.aufgabeKopf}>
            {a.nr}. {a.frage}
          </Text>
          {a.typ === "multiple_choice" &&
            a.optionen?.map((opt, i) => (
              <Text key={i} style={styles.option}>
                {String.fromCharCode(97 + i)}) {opt}
              </Text>
            ))}
          {a.typ === "zuordnung" &&
            a.zuordnungLinks?.map((left, i) => (
              <View key={i} style={styles.zuordnungRow}>
                <Text>{left}</Text>
                <Text>{a.zuordnungRechts?.[i] ?? ""}</Text>
              </View>
            ))}
          {a.typ === "lueckentext" && a.wortliste && a.wortliste.length > 0 && (
            <Text style={styles.option}>Wortliste: {a.wortliste.join(" · ")}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function QuellenListe({
  content,
  layout,
}: {
  content: WorksheetContent;
  layout: LayoutConfig;
}) {
  const styles = buildStyles(layout);
  if (content.quellen.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitel}>Quellenangaben</Text>
      {content.quellen.map((q, i) => (
        <Text key={i} style={styles.quelle}>
          {q.bezeichnung}
          {q.text ? ` — „${q.text}“` : ""}
        </Text>
      ))}
    </View>
  );
}

function LoesungenSeite({
  content,
  layout,
}: {
  content: WorksheetContent;
  layout: LayoutConfig;
}) {
  const styles = buildStyles(layout);
  return (
    <View>
      <Text style={styles.sectionTitel}>Lösungen</Text>
      {content.loesungen.map((l) => (
        <Text key={l.nr} style={styles.aufgabe}>
          {l.nr}. {l.loesung}
        </Text>
      ))}
    </View>
  );
}

export function WorksheetPdfDocument({
  content,
  layout,
  themenbereichLabel,
  erstelltAm,
}: {
  content: WorksheetContent;
  layout: LayoutConfig;
  themenbereichLabel: string;
  erstelltAm: Date;
}) {
  const styles = buildStyles(layout);
  return (
    <Document title={content.titel}>
      <Page size="A4" style={styles.page}>
        <Header
          content={content}
          layout={layout}
          themenbereichLabel={themenbereichLabel}
          erstelltAm={erstelltAm}
        />
        <MusterStreifen layout={layout} />
        <NameZeile layout={layout} />
        {layout.zeigeLernziel && (
          <>
            <Text style={styles.sectionTitel}>Lernziel</Text>
            <Text style={styles.einleitung}>{content.lernziel}</Text>
          </>
        )}
        <Text style={styles.sectionTitel}>Einleitung</Text>
        <Text style={styles.einleitung}>{content.einleitung}</Text>
        <AufgabenListe content={content} layout={layout} />
        {!layout.loesungenSeparat && <LoesungenSeite content={content} layout={layout} />}
        <QuellenListe content={content} layout={layout} />
      </Page>
      {layout.loesungenSeparat && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.titel}>{content.titel} — Lösungsblatt</Text>
          <LoesungenSeite content={content} layout={layout} />
        </Page>
      )}
    </Document>
  );
}
