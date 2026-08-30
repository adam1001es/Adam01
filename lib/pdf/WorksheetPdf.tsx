import React from "react";
import path from "path";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { WorksheetContent, LayoutConfig, Aufgabe } from "@/lib/types";
import { formatDoppelDatum } from "@/lib/hijri";
import { ANFORDERUNGSBEREICHE } from "@/lib/curriculum";
import { ICONS, IconKey } from "@/lib/icons";
import { zuordnungAnzeige } from "@/lib/zuordnung";
import { reihenfolgeAnzeige } from "@/lib/reihenfolge";
import { IslamicPatternStripPdf } from "./IslamicPatternStripPdf";

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

function iconPfadPdf(key: IconKey): string {
  return path.join(process.cwd(), `public/icons/${key}.png`);
}

/** Zeigt entweder ein festes Icon aus der kuratierten Bibliothek oder ein live per Bild-KI
 * generiertes, sicherheitsgeprüftes Motiv - genau eines der beiden ist gesetzt.
 * `generierteBilder` bildet bildGeneriertId auf einen fertigen base64-Data-URI ab (react-pdf
 * kann in Node nicht selbst aus der DB lesen, muss also vorab aufgelöst werden). */
function AufgabenBildPdf({
  bild,
  bildGeneriertId,
  generierteBilder,
  groesse,
}: {
  bild?: IconKey;
  bildGeneriertId?: string;
  generierteBilder: Record<string, string>;
  groesse: number;
}) {
  if (bildGeneriertId && generierteBilder[bildGeneriertId]) {
    return <Image src={generierteBilder[bildGeneriertId]} style={{ width: groesse, height: groesse }} />;
  }
  if (bild) {
    return (
      <Image
        src={iconPfadPdf(bild)}
        style={{ width: groesse * ICONS[bild].seitenverhaeltnis, height: groesse }}
      />
    );
  }
  return null;
}

function buildStyles(layout: LayoutConfig) {
  const baseFontSize = layout.schriftgroesse === "gross" ? 13 : 11;
  const isKompakt = layout.template === "kompakt";
  const isModern = layout.template === "modern";
  const istSchwarzweiss = layout.farbmodus === "schwarzweiss";
  // Bei Schwarz-Weiß-Druck macht der farbige "modern"-Kopfbereich keinen Sinn (viel Toner/Tinte).
  const isModernFarbig = isModern && !istSchwarzweiss;
  const fontFamily = isModern || isKompakt ? "Helvetica" : "Times-Roman";
  const headerColor = isModernFarbig ? "#0f9d58" : "#111111";

  return StyleSheet.create({
    page: {
      fontFamily,
      fontSize: baseFontSize,
      padding: isKompakt ? 24 : 40,
      color: "#1a1a1a",
      lineHeight: 1.4,
    },
    headerBar: {
      backgroundColor: isModernFarbig ? headerColor : "transparent",
      color: isModernFarbig ? "#ffffff" : "#111111",
      padding: isModernFarbig ? 12 : 0,
      marginBottom: isKompakt ? 10 : 18,
      borderBottom: isModernFarbig ? undefined : "2px solid #111111",
      paddingBottom: isModernFarbig ? 12 : 8,
      paddingTop: isModernFarbig ? 12 : 0,
      paddingLeft: isModernFarbig ? 12 : 0,
      paddingRight: isModernFarbig ? 12 : 0,
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
    seiteInhalt: {
      position: "relative",
      flexGrow: 1,
    },
    musterStreifen: {
      marginTop: isModernFarbig ? 0 : 8,
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
      color: isModernFarbig ? headerColor : "#111111",
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
    zuordnungWrapper: {
      flexDirection: "row",
      marginLeft: 12,
      marginTop: 2,
    },
    zuordnungSpalte: {
      flex: 1,
      paddingRight: 8,
    },
    zuordnungZeile: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 3,
    },
    zuordnungBox: {
      width: 12,
      height: 12,
      border: "1px solid #94a3b8",
      borderRadius: 2,
      marginRight: 5,
    },
    zuordnungNummer: {
      width: 16,
    },
    zuordnungOption: {
      marginBottom: 3,
    },
    reihenfolgeListe: {
      marginLeft: 12,
      marginTop: 2,
    },
    lesetextBox: {
      marginLeft: 12,
      marginBottom: 4,
      padding: 8,
      fontStyle: "italic",
      color: "#475569",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 6,
    },
    quelle: {
      marginBottom: 4,
      fontSize: baseFontSize - 1,
    },
    ausmalRahmen: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 6,
      marginLeft: 12,
      padding: 14,
      border: "1.5px dashed #94a3b8",
      borderRadius: 10,
      width: 160,
    },
    bildergeschichteReihe: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 6,
      gap: 10,
    },
    bildergeschichteSchritt: {
      width: 90,
      alignItems: "center",
    },
    bildergeschichteBildRahmen: {
      width: 70,
      height: 70,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
    },
    bildergeschichteText: {
      fontSize: baseFontSize - 3,
      fontStyle: "italic",
      color: "#475569",
      textAlign: "center",
      marginTop: 3,
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

const A4_BREITE_PT = 595.28;

function MusterStreifen({ layout }: { layout: LayoutConfig }) {
  if (!layout.zeigeMuster) return null;
  const styles = buildStyles(layout);
  const seitenPolsterung = layout.template === "kompakt" ? 24 : 40;
  const inhaltBreite = A4_BREITE_PT - 2 * seitenPolsterung;
  return (
    <View style={styles.musterStreifen}>
      <IslamicPatternStripPdf variante={layout.musterVariante} hoehe={16} breite={inhaltBreite} />
    </View>
  );
}

function NameZeile({ layout }: { layout: LayoutConfig }) {
  const styles = buildStyles(layout);
  return (
    <Text style={styles.nameZeile}>
      Name: _______________________  Klasse: __________
      {!layout.zeigeIslamischesDatum && "  Datum: __________"}
    </Text>
  );
}

function AufgabenListe({
  content,
  layout,
  generierteBilder,
}: {
  content: WorksheetContent;
  layout: LayoutConfig;
  generierteBilder: Record<string, string>;
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
          {a.typ === "lesetext" && a.lesetext && (
            <Text style={styles.lesetextBox}>{a.lesetext}</Text>
          )}
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
            zuordnungAnzeige(a) && (
              <View style={styles.zuordnungWrapper}>
                <View style={styles.zuordnungSpalte}>
                  {zuordnungAnzeige(a)!.links.map((l) => (
                    <View key={l.nummer} style={styles.zuordnungZeile}>
                      <View style={styles.zuordnungBox} />
                      <Text style={styles.zuordnungNummer}>{l.nummer}.</Text>
                      <Text>{l.text}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.zuordnungSpalte}>
                  {zuordnungAnzeige(a)!.rechts.map((r) => (
                    <Text key={r.buchstabe} style={styles.zuordnungOption}>
                      {r.buchstabe}) {r.text}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          {a.typ === "reihenfolge" &&
            reihenfolgeAnzeige(a) && (
              <View style={styles.reihenfolgeListe}>
                {reihenfolgeAnzeige(a)!.map((text, i) => (
                  <View key={i} style={styles.zuordnungZeile}>
                    <View style={styles.zuordnungBox} />
                    <Text>{text}</Text>
                  </View>
                ))}
              </View>
            )}
          {a.typ === "lueckentext" && a.wortliste && a.wortliste.length > 0 && (
            <Text style={styles.option}>Wortliste: {a.wortliste.join(" · ")}</Text>
          )}
          {a.typ === "ausmalbild" && (a.bild || a.bildGeneriertId) && (
            <View style={styles.ausmalRahmen}>
              <AufgabenBildPdf
                bild={a.bild}
                bildGeneriertId={a.bildGeneriertId}
                generierteBilder={generierteBilder}
                groesse={110}
              />
            </View>
          )}
          {a.typ === "bildergeschichte" && a.bildergeschichteSchritte && (
            <View style={styles.bildergeschichteReihe}>
              {a.bildergeschichteSchritte.map((schritt, i) => (
                <View key={i} style={styles.bildergeschichteSchritt}>
                  <View style={styles.bildergeschichteBildRahmen}>
                    <AufgabenBildPdf
                      bild={schritt.bild}
                      bildGeneriertId={schritt.bildGeneriertId}
                      generierteBilder={generierteBilder}
                      groesse={50}
                    />
                  </View>
                  <Text style={styles.bildergeschichteText}>{schritt.vorlesetext}</Text>
                </View>
              ))}
            </View>
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
  generierteBilder = {},
}: {
  content: WorksheetContent;
  layout: LayoutConfig;
  themenbereichLabel: string;
  erstelltAm: Date;
  /** bildGeneriertId -> base64-Data-URI, vorab von der aufrufenden Route aufgelöst. */
  generierteBilder?: Record<string, string>;
}) {
  const styles = buildStyles(layout);
  return (
    <Document title={content.titel}>
      <Page size="A4" style={styles.page}>
        <View style={styles.seiteInhalt}>
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
          <AufgabenListe content={content} layout={layout} generierteBilder={generierteBilder} />
          {!layout.loesungenSeparat && <LoesungenSeite content={content} layout={layout} />}
          <QuellenListe content={content} layout={layout} />
        </View>
      </Page>
      {layout.loesungenSeparat && (
        <Page size="A4" style={styles.page}>
          <View style={styles.seiteInhalt}>
            <Text style={styles.titel}>{content.titel} — Lösungsblatt</Text>
            <LoesungenSeite content={content} layout={layout} />
          </View>
        </Page>
      )}
    </Document>
  );
}
