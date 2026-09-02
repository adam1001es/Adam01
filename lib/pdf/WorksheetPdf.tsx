import React from "react";
import fs from "fs";
import path from "path";
import { Document, Page, View, Text, Image, Font, StyleSheet } from "@react-pdf/renderer";
import { WorksheetContent, LayoutConfig, Aufgabe } from "@/lib/types";
import { formatDoppelDatum } from "@/lib/hijri";
import { ICONS, IconKey } from "@/lib/icons";
import { zuordnungAnzeige } from "@/lib/zuordnung";
import { reihenfolgeAnzeige } from "@/lib/reihenfolge";
import { IslamicPatternStripPdf } from "./IslamicPatternStripPdf";
import { berechneRaetselZellgroesse } from "@/lib/raetselLayout";

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

/** Feste Icons als Base64-Data-URIs statt Dateipfad, beim Modul-Laden EINMAL eingelesen -
 * wichtig für Vercel: dort läuft die Route als eigens gebündelte Funktion, deren Dateispur
 * (Node File Trace) NUR Pfade findet, die statisch im Code als Literal erkennbar sind. Ein
 * Pfad, der zur Laufzeit aus einer Variable zusammengesetzt wird
 * (`public/icons/${key}.png`), kann nicht erkannt werden - die PNGs fehlten dadurch im
 * Deployment, `fs.readFileSync` schlug fehl und die PDF-Erstellung brach bei JEDEM
 * Arbeitsblatt mit einer Ausmalbild-/Bildergeschichte-Aufgabe mit festem Icon ab. Deshalb hier
 * bewusst zehn ausgeschriebene, statisch erkennbare Aufrufe statt einer Schleife über
 * ICON_KEYS mit Template-String. */
function liesIconAlsDataUri(dateiname: string): string {
  const buffer = fs.readFileSync(path.join(process.cwd(), "public/icons", dateiname));
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

// Nur für echten arabischen Fließtext (siehe KoranVerseListe unten, ausgabeform "text") - die
// eingebauten PDF-Standardschriften (Times-Roman/Helvetica) unterstützen nur WinAnsi-Kodierung
// und können arabische Schriftzeichen NICHT darstellen (dasselbe Problem, das die diakritikfreie
// Transliteration in generateWorksheet.ts für arabische BEGRIFFE umgeht - hier geht es aber um
// den tatsächlichen Koran-Urtext selbst, der nicht transliteriert werden darf). Noto Naskh Arabic
// (SIL Open Font License) als statische Datei registriert, analog zu den Icons oben.
Font.register({
  family: "NotoNaskhArabic",
  src: path.join(process.cwd(), "public/fonts/NotoNaskhArabic-Regular.ttf"),
});

const ICON_DATA_URIS: Record<IconKey, string> = {
  halbmond: liesIconAlsDataUri("halbmond.png"),
  stern: liesIconAlsDataUri("stern.png"),
  moschee: liesIconAlsDataUri("moschee.png"),
  laterne: liesIconAlsDataUri("laterne.png"),
  herz: liesIconAlsDataUri("herz.png"),
  buch: liesIconAlsDataUri("buch.png"),
  sonne: liesIconAlsDataUri("sonne.png"),
  wassertropfen: liesIconAlsDataUri("wassertropfen.png"),
  familie: liesIconAlsDataUri("familie.png"),
  teppich: liesIconAlsDataUri("teppich.png"),
};

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
        src={ICON_DATA_URIS[bild]}
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
  const headerColor = isModernFarbig ? "#0d9488" : "#111111";

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
      // Bei aktivem Musterband übernimmt das die Trennfunktion zur Namenszeile statt einer
      // zusätzlichen Linie (siehe WorksheetView.tsx für dieselbe Entscheidung im Web).
      marginBottom: isModernFarbig ? (isKompakt ? 10 : 18) : layout.zeigeMuster ? 4 : isKompakt ? 10 : 18,
      borderBottom: isModernFarbig || layout.zeigeMuster ? undefined : "2px solid #111111",
      paddingBottom: isModernFarbig ? 12 : layout.zeigeMuster ? 0 : 8,
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
      // Der Abstand zum Kopftext wird über headerBar.marginBottom gesteuert (das Musterband
      // übernimmt bei aktiviertem Muster die Trennfunktion statt einer Linie) - hier daher kein
      // zusätzlicher marginTop mehr nötig.
      marginTop: 0,
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
    aufgabePunkte: {
      fontWeight: 400,
      opacity: 0.6,
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
      alignItems: "flex-start",
      marginBottom: 3,
    },
    zuordnungBox: {
      width: 12,
      height: 12,
      border: "1px solid #94a3b8",
      borderRadius: 2,
      marginRight: 5,
    },
    // Nur für "zuordnung": Kästchen NACH dem Text statt davor (anders als zuordnungBox oben,
    // die "reihenfolge" weiterhin nutzt) - man liest erst links das Item, dann rechts die
    // passende Beschreibung, und trägt den Buchstaben erst danach ein. Absolut positioniert
    // (statt als Flex-Geschwister NACH dem Text) - @react-pdf/renderer/Yoga berechnet den
    // Textumbruch nicht zuverlässig, wenn ein Element mit fester Breite dem Text in derselben
    // Flex-Zeile folgt (führte zu Überlappung: der Text wurde nicht schmaler als die volle
    // Spaltenbreite umbrochen, das Kästchen landete dadurch über dem Text bzw. der Nachbarspalte).
    // Das gepolsterte zuordnungTextWrap (siehe unten) reserviert den Platz stattdessen über
    // paddingRight, während der Text selbst wieder das letzte (einzige) Element seiner Zeile ist.
    zuordnungBoxNachText: {
      position: "absolute",
      top: 1,
      right: 0,
      width: 12,
      height: 12,
      border: "1px solid #94a3b8",
      borderRadius: 2,
    },
    zuordnungNummer: {
      width: 16,
    },
    zuordnungTextWrap: {
      flex: 1,
      position: "relative",
      paddingRight: 20,
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
    diskussionHinweis: {
      marginLeft: 12,
      fontSize: baseFontSize - 2,
      fontStyle: "italic",
      color: "#94a3b8",
    },
    raetselWrapper: {
      marginLeft: 12,
      marginTop: 4,
    },
    raetselZeile: {
      flexDirection: "row",
    },
    wortsucheZelle: {
      width: 13,
      height: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    // lineHeight bewusst auf 1 statt der von der Seite geerbten 1.4: bei geerbtem lineHeight
    // ergab sich bei fontSize 9 eine Zeilenbox von ~12.6pt, die zusammen mit der internen
    // Positionierung des Textlaufs in der nur 13pt hohen Zelle dazu führte, dass der Buchstabe
    // komplett unsichtbar blieb (kein Clipping an den Rändern, sondern vollständig verschwunden -
    // reproduziert per Debug-Test: bei einer 40x40-Zelle mit sonst identischem Stil war der
    // Buchstabe sichtbar, bei 13x13 nie, unabhängig von Farbe/Ausrichtung/Datenquelle). Mit
    // lineHeight: 1 bleibt die Zeilenbox nah an der reinen Zeichenhöhe und passt sicher in die
    // Zelle.
    wortsucheBuchstabe: {
      fontSize: baseFontSize - 2,
      lineHeight: 1,
    },
    kreuzwortZelleLeer: {
      width: 15,
      height: 15,
    },
    kreuzwortZelle: {
      width: 15,
      height: 15,
      border: "0.75px solid #94a3b8",
      position: "relative",
    },
    kreuzwortNummer: {
      position: "absolute",
      top: 0,
      left: 1,
      fontSize: 5,
      color: "#64748b",
    },
    raetselWortliste: {
      marginTop: 4,
      fontSize: baseFontSize - 1,
    },
    raetselHinweisSpalten: {
      flexDirection: "row",
      marginTop: 6,
      gap: 16,
    },
    raetselHinweisSpalte: {
      flex: 1,
    },
    raetselHinweisTitel: {
      fontWeight: 700,
      marginBottom: 2,
    },
    raetselHinweisZeile: {
      fontSize: baseFontSize - 1,
      marginBottom: 1,
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
    malRahmen: {
      marginTop: 6,
      marginLeft: 12,
      height: 150,
      border: "1.5px dashed #94a3b8",
      borderRadius: 10,
    },
    rechercheBlock: {
      marginLeft: 12,
      marginTop: 4,
    },
    rechercheLabel: {
      fontWeight: 700,
      marginBottom: 2,
    },
    rechercheZeile: {
      marginBottom: 1,
    },
    rechercheHinweis: {
      marginTop: 4,
      fontStyle: "italic",
      color: "#475569",
    },
    bewegungHinweis: {
      marginLeft: 12,
      marginTop: 2,
      fontSize: baseFontSize - 2,
      fontStyle: "italic",
      color: "#94a3b8",
    },
    bewegungListe: {
      marginLeft: 12,
      marginTop: 2,
    },
    bewegungZeile: {
      marginBottom: 2,
    },
    sortierKategorienReihe: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 6,
      marginLeft: 12,
      gap: 8,
    },
    sortierKategorie: {
      flexGrow: 1,
      minWidth: 100,
      minHeight: 40,
      border: "1.5px solid #94a3b8",
      borderRadius: 6,
      padding: 6,
      textAlign: "center",
      fontSize: baseFontSize - 1,
      fontWeight: 700,
      color: "#64748b",
    },
    sortierKartenReihe: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 8,
      marginLeft: 12,
      gap: 6,
    },
    sortierKarte: {
      border: "1.5px dashed #94a3b8",
      borderRadius: 4,
      backgroundColor: "#f8fafc",
      paddingVertical: 4,
      paddingHorizontal: 8,
      fontSize: baseFontSize - 1,
    },
    nachspurZeile: {
      marginLeft: 12,
      marginTop: 8,
      paddingBottom: 4,
      borderBottom: "1px dotted #94a3b8",
    },
    nachspurText: {
      fontSize: baseFontSize + 6,
      letterSpacing: 2,
      color: "#cbd5e1",
    },
    koranVers: {
      marginBottom: isKompakt ? 10 : 16,
      paddingBottom: isKompakt ? 10 : 16,
      borderBottom: "1px solid #f1f5f9",
    },
    koranArabisch: {
      fontFamily: "NotoNaskhArabic",
      direction: "rtl",
      textAlign: "right",
      fontSize: baseFontSize + 7,
      lineHeight: 1.9,
      marginBottom: 5,
    },
    koranDeutsch: {
      fontSize: baseFontSize,
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
      {/* Fach/Schulstufe/Thema/Themenbereich sind reine Formular-Metadaten für die Lehrkraft -
          auf dem Blatt, das Schüler:innen bekommen, haben sie nichts verloren (siehe
          WorksheetView.tsx für dieselbe Entscheidung im Web-Druck). themenbereichLabel bleibt
          als Prop bestehen, wird hier aber bewusst nicht mehr gerendert. */}
      {layout.zeigeIslamischesDatum ? (
        <Text style={styles.metaZeile2}>{formatDoppelDatum(erstelltAm)}</Text>
      ) : null}
    </View>
  );
}

const A4_BREITE_PT = 595.28;

/** Zellgröße für Wortsuche-/Kreuzworträtsel-Gitter (in pt) - siehe lib/raetselLayout.ts für die
 * Formel, hier nur die PDF-spezifische verfügbare Seitenbreite ermittelt. */
function raetselZellgroesse(spalten: number, template: LayoutConfig["template"]): number {
  const seitenPolsterung = template === "kompakt" ? 24 : 40;
  const inhaltBreite = A4_BREITE_PT - 2 * seitenPolsterung;
  return berechneRaetselZellgroesse(inhaltBreite, spalten);
}

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
  if (content.aufgaben.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitel}>Aufgaben</Text>
      {content.aufgaben.map((a) => (
        <View key={a.nr} style={styles.aufgabe} wrap={false}>
          {/* AFB-Angabe ("Reproduktion"/"Transfer"/...) ist Lehrkraft-Jargon und würde
              Schüler:innen nur irritieren - bewusst nicht mit auf dem Blatt. */}
          <Text style={styles.aufgabeTyp}>{TYP_LABEL[a.typ]}</Text>
          {a.lesetext && <Text style={styles.lesetextBox}>{a.lesetext}</Text>}
          <Text style={styles.aufgabeKopf}>
            {a.nr}. {a.frage}
            {a.punkte !== undefined && <Text style={styles.aufgabePunkte}> ({a.punkte} P.)</Text>}
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
                      <Text style={styles.zuordnungNummer}>{l.nummer}.</Text>
                      <View style={styles.zuordnungTextWrap}>
                        <Text>{l.text}</Text>
                        <View style={styles.zuordnungBoxNachText} />
                      </View>
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
          {a.typ === "diskussion" && (
            <Text style={styles.diskussionHinweis}>
              Mündliche Diskussion in der Klasse - kein schriftliches Ergebnis nötig.
            </Text>
          )}
          {a.typ === "wortsuche" && a.wortsucheGitter && (() => {
            const zellgroesse = raetselZellgroesse(a.wortsucheGitter[0]?.length ?? 10, layout.template);
            return (
              <View style={styles.raetselWrapper}>
                {a.wortsucheGitter.map((zeile, r) => (
                  <View key={r} style={styles.raetselZeile}>
                    {zeile.map((buchstabe, c) => (
                      <View
                        key={c}
                        style={[styles.wortsucheZelle, { width: zellgroesse, height: zellgroesse }]}
                      >
                        <Text
                          style={[styles.wortsucheBuchstabe, { fontSize: zellgroesse * 0.55 }]}
                        >
                          {buchstabe}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
                {a.wortsucheWoerter && a.wortsucheWoerter.length > 0 && (
                  <Text style={styles.raetselWortliste}>
                    Gesuchte Wörter: {a.wortsucheWoerter.join(" · ")}
                  </Text>
                )}
              </View>
            );
          })()}
          {a.typ === "kreuzwortraetsel" && a.kreuzwortGitter && (() => {
            const zellgroesse = raetselZellgroesse(a.kreuzwortGitter[0]?.length ?? 10, layout.template);
            return (
            <View style={styles.raetselWrapper}>
              {a.kreuzwortGitter.map((zeile, r) => (
                <View key={r} style={styles.raetselZeile}>
                  {zeile.map((zelle, c) =>
                    zelle ? (
                      <View
                        key={c}
                        style={[styles.kreuzwortZelle, { width: zellgroesse, height: zellgroesse }]}
                      >
                        {zelle.nummer !== null && (
                          <Text style={styles.kreuzwortNummer}>{zelle.nummer}</Text>
                        )}
                      </View>
                    ) : (
                      <View
                        key={c}
                        style={[styles.kreuzwortZelleLeer, { width: zellgroesse, height: zellgroesse }]}
                      />
                    ),
                  )}
                </View>
              ))}
              <View style={styles.raetselHinweisSpalten}>
                {a.kreuzwortWaagerecht && a.kreuzwortWaagerecht.length > 0 && (
                  <View style={styles.raetselHinweisSpalte}>
                    <Text style={styles.raetselHinweisTitel}>Waagerecht</Text>
                    {a.kreuzwortWaagerecht.map((w) => (
                      <Text key={w.nummer} style={styles.raetselHinweisZeile}>
                        {w.nummer}. {w.hinweis}
                      </Text>
                    ))}
                  </View>
                )}
                {a.kreuzwortSenkrecht && a.kreuzwortSenkrecht.length > 0 && (
                  <View style={styles.raetselHinweisSpalte}>
                    <Text style={styles.raetselHinweisTitel}>Senkrecht</Text>
                    {a.kreuzwortSenkrecht.map((w) => (
                      <Text key={w.nummer} style={styles.raetselHinweisZeile}>
                        {w.nummer}. {w.hinweis}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
            );
          })()}
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
          {a.typ === "malaufgabe" && <View style={styles.malRahmen} />}
          {a.typ === "recherche_auftrag" && (
            <View style={styles.rechercheBlock}>
              {a.leitfaden && a.leitfaden.length > 0 && (
                <>
                  <Text style={styles.rechercheLabel}>Leitfaden</Text>
                  {a.leitfaden.map((punkt, i) => (
                    <Text key={i} style={styles.rechercheZeile}>
                      {i + 1}. {punkt}
                    </Text>
                  ))}
                </>
              )}
              {a.bewertungskriterien && a.bewertungskriterien.length > 0 && (
                <>
                  <Text style={[styles.rechercheLabel, { marginTop: 6 }]}>Darauf wird geachtet</Text>
                  {a.bewertungskriterien.map((kriterium, i) => (
                    <Text key={i} style={styles.rechercheZeile}>
                      • {kriterium}
                    </Text>
                  ))}
                </>
              )}
              {a.quellenhinweis && (
                <Text style={styles.rechercheHinweis}>Hinweis zu Quellen: {a.quellenhinweis}</Text>
              )}
            </View>
          )}
          {a.typ === "bewegungsaufgabe" && a.bewegungsElemente && a.bewegungsElemente.length > 0 && (
            <View>
              <Text style={styles.bewegungHinweis}>
                Nacheinander vorlesen - Auflösung, bei welchen Begriffen reagiert werden soll, siehe Lösungsblatt.
              </Text>
              <View style={styles.bewegungListe}>
                {a.bewegungsElemente.map((element, i) => (
                  <Text key={i} style={styles.bewegungZeile}>
                    • {element}
                  </Text>
                ))}
              </View>
            </View>
          )}
          {a.typ === "sortierkarten" && a.sortierKategorien && a.sortierKarten && (
            <View>
              <View style={styles.sortierKategorienReihe}>
                {a.sortierKategorien.map((kategorie, i) => (
                  <Text key={i} style={styles.sortierKategorie}>
                    {kategorie}
                  </Text>
                ))}
              </View>
              <View style={styles.sortierKartenReihe}>
                {a.sortierKarten.map((karte, i) => (
                  <Text key={i} style={styles.sortierKarte}>
                    {karte.text}
                  </Text>
                ))}
              </View>
            </View>
          )}
          {a.typ === "nachspuruebung" && a.nachspurText && (
            <View>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.nachspurZeile}>
                  <Text style={styles.nachspurText}>{a.nachspurText}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

/** ausgabeform "text" (siehe koranVerse in lib/types.ts, buildKoranTextContent in
 * lib/quranApi.ts) - reiner Vers-Wortlaut ohne Aufgaben, Arabisch (rechtsbündig, siehe
 * registrierte NotoNaskhArabic-Schrift oben) direkt über der deutschen Übersetzung. */
function KoranVerseListe({ content, layout }: { content: WorksheetContent; layout: LayoutConfig }) {
  const styles = buildStyles(layout);
  if (!content.koranVerse || content.koranVerse.length === 0) return null;
  return (
    <View>
      {content.koranVerse.map((v) => (
        <View key={v.versNummer} style={styles.koranVers} wrap={false}>
          <Text style={styles.koranArabisch}>{v.arabisch}</Text>
          <Text style={styles.koranDeutsch}>{v.deutsch}</Text>
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
          <KoranVerseListe content={content} layout={layout} />
          <AufgabenListe content={content} layout={layout} generierteBilder={generierteBilder} />
          <QuellenListe content={content} layout={layout} />
        </View>
      </Page>
      {/* Lösungen erscheinen bewusst NIE auf dem Arbeitsblatt selbst - immer auf einer eigenen,
          separaten Seite, damit sie nicht versehentlich mit an Schüler:innen geht. Bei reinem
          Koran-Text (ausgabeform "text", siehe koranVerse oben) gibt es keine Aufgaben/Lösungen -
          die ganze Lösungsseite entfällt dann. */}
      {content.loesungen.length > 0 && (
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
