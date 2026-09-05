import JSZip from "jszip";
import type { JahresplanKalenderWoche } from "./jahresplanKalender";

/**
 * Parst eine vom Schulamt der IGGÖ übermittelte Jahresplanungs-Word-Vorlage automatisch in
 * JahresplanKalenderWoche[] (siehe lib/jahresplanKalender.ts) - Grundlage für den admin-exklusiven
 * Upload künftiger Schuljahre (siehe app/admin/jahresplan-varianten). Bewusst regex-basiert auf
 * dem rohen word/document.xml statt einer vollständigen XML-Bibliothek: die beiden real
 * erhaltenen Vorlagen für 2026/27 haben eine simple, konsistente Struktur (eine Tabelle pro
 * Semester, Kopfzeile mit 5 Zellen dank Zellverbund, jede Datenzeile mit 6 Zellen), die sich damit
 * verlässlich erkennen lässt, ohne die Komplexität eines vollen DOCX-Parsers.
 *
 * WICHTIGE BEOBACHTUNG aus den realen Vorlagen: Die "Wochenthema"-Spalte (Zelle 2) ist vom
 * Schulamt selbst bereits mit administrativen Hinweisen vorausgefüllt (z.B. "Schulbeginn:
 * 07.09.2026", "Semesterferien ...", teils auch mit denselben Feiertagsnamen wie die
 * "Anmerkung"-Spalte, siehe z.B. die Ramadanfest-Woche, wo "Di., 09.03.: Ramadanfest (1. Tag)" in
 * BEIDEN Zellen steht). Diese App verwendet die "Wochenthema"-Spalte NICHT als editierbares Feld
 * für die Lehrkraft (das wäre sonst beim Import überschrieben), sondern führt ihren Inhalt mit der
 * echten "Anmerkung"-Spalte zusammen (Duplikate dabei entfernt) - genau wie bei der bisherigen
 * manuellen Übertragung der ersten beiden Vorlagen (siehe lib/jahresplanKalender.ts).
 *
 * Liefert zusätzlich Warnungen für Zeilen, die nicht sauber gelesen werden konnten (z.B. ein nicht
 * erkanntes Datumsformat) - der Admin sieht diese in der Vorschau (siehe
 * app/api/admin/jahresplan-varianten/vorschau/route.ts) und kann betroffene Zeilen von Hand
 * nachbessern, bevor die Variante gespeichert wird. Ändert das Schulamt das Vorlagen-Layout
 * spürbar (andere Spaltenzahl, andere Reihenfolge), liefert diese Funktion im Zweifel eher LEERE
 * oder mit Warnungen markierte Zeilen als falsche Daten - stille Fehlinterpretation ist hier
 * riskanter als ein sichtbarer Fehlschlag, weil das Ergebnis eine offizielle Dienstpflicht-
 * Dokumentation stützt.
 */

export interface JahresplanImportErgebnis {
  wochen: JahresplanKalenderWoche[];
  warnungen: string[];
}

async function leseDocumentXml(buffer: Buffer): Promise<string> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error("Die Datei konnte nicht als .docx gelesen werden (kein gültiges ZIP-Archiv).");
  }
  const datei = zip.file("word/document.xml");
  if (!datei) {
    throw new Error("Keine gültige .docx-Datei (word/document.xml fehlt im Archiv).");
  }
  return datei.async("string");
}

function extrahiereAlle(text: string, regex: RegExp): string[] {
  return text.match(regex) ?? [];
}

function zellenAbsaetze(zelle: string): string[] {
  const absaetze = extrahiereAlle(zelle, /<w:p\b[\s\S]*?<\/w:p>/g);
  return absaetze.map((p) => {
    const runs = extrahiereAlle(p, /<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
    return runs
      .map((r) => r.replace(/^<w:t[^>]*>/, "").replace(/<\/w:t>$/, ""))
      .join("")
      .trim();
  });
}

// "07.09. – 13.09.26" bzw. "28.12. – 03.01.27" - das Jahr steht NUR auf der "bis"-Seite (zweistellig).
// Wechselt der Monat beim Jahreswechsel (z.B. Dezember -> Jänner), liegt "von" im VORjahr.
const DATUM_REGEX = /^(\d{2})\.(\d{2})\.\s*[–-]\s*(\d{2})\.(\d{2})\.(\d{2})$/;

function parseDatum(text: string): { von: string; bis: string } | null {
  const match = text.match(DATUM_REGEX);
  if (!match) return null;
  const [, vonTagS, vonMonatS, bisTagS, bisMonatS, bisJahrKurzS] = match;
  const bisJahr = 2000 + parseInt(bisJahrKurzS, 10);
  const vonMonat = parseInt(vonMonatS, 10);
  const bisMonat = parseInt(bisMonatS, 10);
  const vonJahr = vonMonat <= bisMonat ? bisJahr : bisJahr - 1;
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return {
    von: `${vonJahr}-${pad2(vonMonat)}-${pad2(parseInt(vonTagS, 10))}`,
    bis: `${bisJahr}-${pad2(bisMonat)}-${pad2(parseInt(bisTagS, 10))}`,
  };
}

export async function parseJahresplanVorlage(buffer: Buffer): Promise<JahresplanImportErgebnis> {
  const xml = await leseDocumentXml(buffer);
  const tabellen = extrahiereAlle(xml, /<w:tbl>[\s\S]*?<\/w:tbl>/g);
  if (tabellen.length === 0) {
    throw new Error("Keine Tabelle in der Datei gefunden - ist das die richtige Vorlage?");
  }

  const wochen: JahresplanKalenderWoche[] = [];
  const warnungen: string[] = [];

  tabellen.forEach((tabelle, tabellenIndex) => {
    const semester: 1 | 2 = tabellenIndex === 0 ? 1 : 2;
    const zeilen = extrahiereAlle(tabelle, /<w:tr\b[\s\S]*?<\/w:tr>/g);

    for (const zeile of zeilen) {
      const zellen = extrahiereAlle(zeile, /<w:tc>[\s\S]*?<\/w:tc>/g);
      // Kopfzeile (Zellverbund "Woche"+"Datum") hat nur 5 Zellen, Datenzeilen 6 - siehe Modul-Kommentar.
      if (zellen.length < 6) continue;

      const nummerText = (zellenAbsaetze(zellen[0])[0] ?? "").replace(".", "").trim();
      const nummer = parseInt(nummerText, 10);
      if (!nummer) continue;

      const datumAbsaetze = zellenAbsaetze(zellen[1]);
      const geparstesDatum = parseDatum(datumAbsaetze[0] ?? "");
      if (!geparstesDatum) {
        warnungen.push(
          `Woche ${nummer}: Datum "${datumAbsaetze[0] ?? ""}" konnte nicht gelesen werden - bitte von Hand nachtragen.`,
        );
        continue;
      }
      const hijri = datumAbsaetze[1] ?? "";

      const wochenthemaZeilen = zellenAbsaetze(zellen[2]).filter((t) => t);
      const anmerkungZeilen = zellenAbsaetze(zellen[4]).filter((t) => t);
      const anmerkungen: string[] = [];
      for (const t of [...wochenthemaZeilen, ...anmerkungZeilen]) {
        if (!anmerkungen.includes(t)) anmerkungen.push(t);
      }

      wochen.push({ nummer, semester, von: geparstesDatum.von, bis: geparstesDatum.bis, hijri, anmerkungen });
    }
  });

  wochen.sort((a, b) => a.nummer - b.nummer);
  if (wochen.length === 0) {
    throw new Error("Es konnten keine Wochen aus der Datei gelesen werden.");
  }
  return { wochen, warnungen };
}
