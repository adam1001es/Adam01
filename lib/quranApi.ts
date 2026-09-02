/**
 * Live-Anbindung an die Al-Quran-Cloud-API (https://alquran.cloud/api) statt den Korantext
 * selbst zu speichern oder aus dem Gedächtnis zu reproduzieren - der arabische Urtext ist zwar
 * gemeinfrei, eine deutsche ÜBERSETZUNG (hier: Bubenheim & Elyas, Edition "de.bubenheim") ist
 * aber ein eigenständiges, urheberrechtlich geschütztes Werk. Die API liefert sie mit Erlaubnis
 * der Rechteinhaber bereitgestellt und live pro Anfrage aus - wir übernehmen aus einem Treffer
 * gezielt nur die vom Admin ausgewählten einzelnen Verse in die Wissensbasis (siehe
 * app/admin/wissensbasis, lib/wissensbasis.ts), nie den kompletten Text auf Vorrat.
 */

import type { WorksheetContent } from "./types";

const API_BASIS = "https://api.alquran.cloud/v1";
const DEUTSCHE_EDITION = "de.bubenheim";
const ARABISCHE_EDITION = "quran-uthmani";

export interface QuranVers {
  sureNummer: number;
  /** Transliterierter Name (z.B. "Al-Baqarah"), nicht die englische Bedeutungsübersetzung -
   * dieselbe Schreibweise, wie sie in deutschsprachigen Lehrmaterialien üblich ist. */
  sureNameTransliteriert: string;
  versNummer: number;
  arabisch: string;
  deutsch: string;
}

interface AlquranCloudAyahEdition {
  text: string;
  surah: { number: number; name: string; englishName: string; englishNameTranslation: string };
  numberInSurah: number;
}

interface AlquranCloudAyahResponse {
  code: number;
  status: string;
  data: AlquranCloudAyahEdition[];
}

/** Holt einen einzelnen Vers (Arabisch + deutsche Übersetzung) live von der API. Wirft bei
 * ungültiger Referenz oder Netzwerkfehler eine Error mit für Admins verständlicher Meldung. */
export async function holeVers(sureNummer: number, versNummer: number): Promise<QuranVers> {
  const referenz = `${sureNummer}:${versNummer}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASIS}/ayah/${referenz}/editions/${ARABISCHE_EDITION},${DEUTSCHE_EDITION}`, {
      // Korantext ändert sich nicht - 30 Tage cachen spart wiederholte Anfragen an Fremdserver.
      next: { revalidate: 60 * 60 * 24 * 30 },
      // Läuft seit dem automatischen Abgleich (siehe gleicheQuellenMitKoranApiAb) bei JEDER
      // Arbeitsblatt-Generierung im Hintergrund mit - ein hängender/sehr langsamer Fremdserver
      // darf die Generierung nicht unbegrenzt verzögern, daher hartes Zeitlimit statt der
      // Standard-Zeitüberschreitung von fetch (die es praktisch nicht gibt).
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error(`Vers ${referenz} konnte nicht abgerufen werden (Netzwerkfehler).`);
  }
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? `Vers ${referenz} existiert nicht (Sure hat weniger Verse, oder Sure-Nummer ungültig).`
        : `Vers ${referenz} konnte nicht abgerufen werden (Status ${res.status}).`,
    );
  }
  const json = (await res.json()) as AlquranCloudAyahResponse;
  if (json.code !== 200 || !Array.isArray(json.data) || json.data.length < 2) {
    throw new Error(`Unerwartete Antwort der Koran-API für ${referenz}.`);
  }
  const [arabisch, deutsch] = json.data;
  return {
    sureNummer,
    sureNameTransliteriert: arabisch.surah.englishName,
    versNummer,
    arabisch: arabisch.text,
    deutsch: deutsch.text,
  };
}

const MAX_VERSE_PRO_ABFRAGE = 20;

/** Holt einen zusammenhängenden Versbereich derselben Sure - auf 20 Verse begrenzt, damit ein
 * einzelner "Zitat"-Eintrag ein Zitat bleibt und nicht versehentlich eine halbe Sure wird. */
export async function holeVersBereich(
  sureNummer: number,
  vonVers: number,
  bisVers: number,
): Promise<QuranVers[]> {
  if (bisVers < vonVers) {
    throw new Error("„Bis Vers“ darf nicht kleiner als „Von Vers“ sein.");
  }
  if (bisVers - vonVers + 1 > MAX_VERSE_PRO_ABFRAGE) {
    throw new Error(`Höchstens ${MAX_VERSE_PRO_ABFRAGE} Verse pro Abfrage - für längere Abschnitte einzeln anlegen.`);
  }
  const nummern = Array.from({ length: bisVers - vonVers + 1 }, (_, i) => vonVers + i);
  return Promise.all(nummern.map((v) => holeVers(sureNummer, v)));
}

/** Baut aus einem (zusammenhängenden) Vers-Ergebnis die einheitliche Quellenangabe + den
 * Zitattext - von der Admin-Nachschlagemaske (KoranNachschlagen in WissensbasisClient.tsx) UND
 * vom automatischen Abgleich unten verwendet, damit beide nie unterschiedlich formatieren. Der
 * Bubenheim-&-Elyas-Text jedes Verses beginnt bereits selbst mit seiner Versnummer (z.B. "255.
 * Allah - ..."), daher reicht ein einfaches Zusammenfügen ohne zusätzliche Nummerierung. */
export function formatiereKoranZitat(verse: QuranVers[]): { bezeichnung: string; text: string } {
  const erste = verse[0];
  const letzte = verse[verse.length - 1];
  const bezeichnung =
    verse.length === 1
      ? `Sure ${erste.sureNummer} (${erste.sureNameTransliteriert}), Vers ${erste.versNummer}`
      : `Sure ${erste.sureNummer} (${erste.sureNameTransliteriert}), Verse ${erste.versNummer}-${letzte.versNummer}`;
  return { bezeichnung, text: verse.map((v) => v.deutsch).join(" ") };
}

/** Erkennt in einer Quellen-"bezeichnung" wie "Koran, Sure 2, Vers 255" oder "Sure 2:255-257"
 * eine konkrete Sure-/Vers-Referenz. Absichtlich nur die beiden gängigen, eindeutigen Schreibweisen
 * (siehe GENERATION_SYSTEM_PROMPT_BASE-Beispiel "Koran, Sure 1") - alles andere (z.B. eine ganze
 * Sure ohne Versangabe, oder Hadith-Quellenangaben) bleibt bewusst unangetastet statt geraten. */
function parseKoranReferenz(bezeichnung: string): { sure: number; von: number; bis: number } | null {
  const match =
    bezeichnung.match(/Sure\s+(\d{1,3})\D{0,15}?Vers(?:e)?\.?\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?/i) ??
    bezeichnung.match(/Sure\s+(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?/i);
  if (!match) return null;
  const sure = Number(match[1]);
  const von = Number(match[2]);
  const bis = match[3] ? Number(match[3]) : von;
  if (sure < 1 || sure > 114 || von < 1 || bis < von) return null;
  return { sure, von, bis };
}

/**
 * Gleicht jede erkennbare Koran-Quellenangabe eines generierten Arbeitsblatts live gegen diese
 * API ab, statt sich auf Claudes Erinnerung oder eine manuell kuratierte Vorab-Datenbank zu
 * verlassen - bei über 6000 Versen im Koran ist eine vollständige manuelle Prüfung durch den
 * Admin nicht praktikabel. Ersetzt bei Erfolg Bezeichnung/Text durch den echten, geprüften
 * Vers-Text und markiert die Quelle als "gesichert"; schlägt der Abgleich fehl (Vers existiert
 * nicht = erfundene Angabe, oder Netzwerkfehler), wird "sicherheit" immer auf "bitte_pruefen"
 * heruntergestuft - nie umgekehrt, eine ungeprüfte Angabe wird nie automatisch als "gesichert"
 * markiert. Mutiert `content.quellen` direkt, analog zu den übrigen Nachbearbeitungsschritten in
 * generiereUndPruefeEinmal (lib/generateWorksheet.ts).
 */
export async function gleicheQuellenMitKoranApiAb(content: WorksheetContent): Promise<void> {
  for (const quelle of content.quellen) {
    const referenz = parseKoranReferenz(quelle.bezeichnung);
    if (!referenz) continue;
    try {
      const verse = await holeVersBereich(referenz.sure, referenz.von, referenz.bis);
      const { bezeichnung, text } = formatiereKoranZitat(verse);
      quelle.bezeichnung = bezeichnung;
      quelle.text = text;
      quelle.sicherheit = "gesichert";
    } catch {
      quelle.sicherheit = "bitte_pruefen";
    }
  }
}
