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

function warte(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Läuft jedem Aufruf gegen diese API voran, statt direkt fetch() zu nutzen: Vercel-Funktionen
 * teilen sich Ausgangs-IPs mit vielen fremden, unabhängigen Projekten, ein 429 (Rate-Limit) dieses
 * kostenlosen Fremddienstes kann daher auch bei geringer eigener Last auftreten (real beobachtet)
 * und ist praktisch immer nach kurzer Zeit wieder verschwunden - ein einziger Wiederholungsversuch
 * genügt dafür, ohne im Fall einer echten längeren Störung unnötig lange zu blockieren. */
async function fetchKoranApi(url: string): Promise<Response> {
  for (let versuch = 1; versuch <= 2; versuch++) {
    let res: Response;
    try {
      res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 }, signal: AbortSignal.timeout(8000) });
    } catch (err) {
      if (versuch === 2) throw err;
      await warte(600);
      continue;
    }
    if (res.status === 429 && versuch === 1) {
      await warte(600);
      continue;
    }
    return res;
  }
  // Unerreichbar (die Schleife kehrt in jedem Fall über return oder throw zurück) - nur für TS.
  throw new Error("fetchKoranApi: unerwarteter Zustand.");
}

/** Holt einen einzelnen Vers (Arabisch + deutsche Übersetzung) live von der API. Wirft bei
 * ungültiger Referenz oder Netzwerkfehler eine Error mit für Admins verständlicher Meldung. */
export async function holeVers(sureNummer: number, versNummer: number): Promise<QuranVers> {
  const referenz = `${sureNummer}:${versNummer}`;
  let res: Response;
  try {
    res = await fetchKoranApi(`${API_BASIS}/ayah/${referenz}/editions/${ARABISCHE_EDITION},${DEUTSCHE_EDITION}`);
  } catch {
    throw new Error(`Vers ${referenz} konnte nicht abgerufen werden (Netzwerkfehler).`);
  }
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? `Vers ${referenz} existiert nicht (Sure hat weniger Verse, oder Sure-Nummer ungültig).`
        : res.status === 429
          ? `Vers ${referenz} konnte gerade nicht abgerufen werden, weil der Koran-Dienst kurzzeitig überlastet ist. Bitte in ein bis zwei Minuten erneut versuchen.`
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

export const MAX_VERSE_PRO_ABFRAGE = 20;

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

export interface SurahMeta {
  nummer: number;
  nameArabisch: string;
  nameTransliteriert: string;
  bedeutung: string;
  verseAnzahl: number;
}

interface AlquranCloudSurahListResponse {
  code: number;
  status: string;
  data: { number: number; name: string; englishName: string; englishNameTranslation: string; numberOfAyahs: number }[];
}

/** Liste aller 114 Suren mit Name + Versanzahl - live von der API statt fest im Code hinterlegt
 * (Namen/Versanzahlen sind zwar statisch, aber 114 Einträge von Hand zu pflegen wäre eine
 * genauso vermeidbare Fehlerquelle wie das eingangs verworfene Abschreiben des Korantexts selbst).
 * Für die Sure-Auswahlliste im Erstellen-Formular (siehe app/api/koran/suren). 30 Tage gecacht. */
export async function holeAlleSuren(): Promise<SurahMeta[]> {
  let res: Response;
  try {
    res = await fetchKoranApi(`${API_BASIS}/surah`);
  } catch {
    throw new Error("Suren-Liste konnte nicht abgerufen werden (Netzwerkfehler).");
  }
  if (!res.ok) {
    throw new Error(
      res.status === 429
        ? "Suren-Liste konnte gerade nicht abgerufen werden, weil der Koran-Dienst kurzzeitig überlastet ist. Bitte in ein bis zwei Minuten erneut versuchen."
        : `Suren-Liste konnte nicht abgerufen werden (Status ${res.status}).`,
    );
  }
  const json = (await res.json()) as AlquranCloudSurahListResponse;
  if (json.code !== 200 || !Array.isArray(json.data)) {
    throw new Error("Unerwartete Antwort der Koran-API für die Suren-Liste.");
  }
  return json.data.map((s) => ({
    nummer: s.number,
    nameArabisch: s.name,
    nameTransliteriert: s.englishName,
    bedeutung: s.englishNameTranslation,
    verseAnzahl: s.numberOfAyahs,
  }));
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

/**
 * Baut den System-Prompt-Baustein für den optionalen Koran-Fokus im Erstellen-Formular (siehe
 * GenerateRequestSchema.koranFokus, NewWorksheetForm.tsx) - die Lehrkraft möchte eine konkrete
 * Sure/einen Versbereich mit der Klasse lernen. Liefert Claude den live abgerufenen, garantiert
 * korrekten Text als verbindliche Grundlage mit, statt das Arbeitsblatt frei zum Thema generieren
 * zu lassen und den Text erst hinterher zu prüfen (siehe gleicheQuellenMitKoranApiAb, das als
 * zusätzliches Sicherheitsnetz trotzdem weiterhin läuft).
 */
export function buildKoranFokusSystemContext(verse: QuranVers[]): string {
  const { bezeichnung } = formatiereKoranZitat(verse);
  const zeilen = verse.map((v) => `${v.versNummer}. ${v.arabisch}\n${v.versNummer}. ${v.deutsch}`).join("\n");
  return `FOKUS-VORGABE DER LEHRKRAFT: Dieses Arbeitsblatt soll sich gezielt um den folgenden Korantext drehen, den die Lehrkraft mit der Klasse lernen möchte. Das ist der tatsächliche, live von der Koran-API abgerufene Text (Arabisch + deutsche Übersetzung von Bubenheim & Elyas) - nutze AUSSCHLIESSLICH diesen Wortlaut als Grundlage, erfinde nichts hinzu und weiche nicht davon ab:

${bezeichnung}
${zeilen}

Baue die Aufgaben gezielt um diesen Text herum (z.B. inhaltliche Verständnisfragen zum Vers, Zuordnung arabischer Schlüsselbegriffe zur deutschen Bedeutung, Lückentext mit Wörtern aus dem Text, richtige Reihenfolge der Verse, Vorbereitung fürs Auswendiglernen) statt eines allgemeinen Themas zur Grundkompetenz. Übernimm den Text UNVERÄNDERT als eigenen Eintrag in "quellen" mit "bezeichnung": "${bezeichnung}" (exakt in diesem Format) und "sicherheit": "gesichert".`;
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
 * generiereUndPruefeEinmal (lib/generateWorksheet.ts). Gibt die Bezeichnungen der erfolgreich
 * live geprüften Quellen zurück, damit die anschließende Verifikation (siehe
 * buildKoranVerifikationsHinweis) weiß, bei welchen "gesichert"-Angaben der Wortlaut bereits
 * mechanisch garantiert korrekt ist und nicht zusätzlich misstrauisch hinterfragt werden muss.
 */
export async function gleicheQuellenMitKoranApiAb(content: WorksheetContent): Promise<string[]> {
  const liveGeprueft: string[] = [];
  for (const quelle of content.quellen) {
    const referenz = parseKoranReferenz(quelle.bezeichnung);
    if (!referenz) continue;
    try {
      const verse = await holeVersBereich(referenz.sure, referenz.von, referenz.bis);
      const { bezeichnung, text } = formatiereKoranZitat(verse);
      quelle.bezeichnung = bezeichnung;
      quelle.text = text;
      quelle.sicherheit = "gesichert";
      liveGeprueft.push(bezeichnung);
    } catch {
      quelle.sicherheit = "bitte_pruefen";
    }
  }
  return liveGeprueft;
}

/**
 * System-Prompt-Baustein NUR für die Verifikations-Stufe (siehe generiereUndPruefeEinmal): die
 * dort geltende generelle Anweisung "sei besonders streng bei sicherheit: gesichert" gilt für vom
 * Modell selbst behauptete Sicherheit - bei den hier gelisteten Quellen wurde der Wortlaut aber
 * bereits mechanisch gegen die Koran-API abgeglichen (siehe gleicheQuellenMitKoranApiAb), ist also
 * garantiert exakt korrekt. Ohne diesen Hinweis warnt die Prüfung sonst unnötig vor möglichen
 * Wortlaut-Abweichungen bei einem Zitat, das gar nicht aus Claudes Erinnerung stammt.
 */
export function buildKoranVerifikationsHinweis(liveGeprueft: string[]): string {
  if (liveGeprueft.length === 0) return "";
  return `Folgende Quellenangaben wurden NICHT vom Modell erinnert, sondern mechanisch live gegen die Koran-API abgeglichen - ihr Wortlaut ist garantiert exakt korrekt und muss NICHT auf Zitattreue hinterfragt werden, auch wenn die generelle Anweisung zu "sicherheit": "gesichert" oben das sonst nahelegt: ${liveGeprueft.join("; ")}. Prüfe bei diesen nur die thematische/pädagogische Passung zu den Aufgaben, nicht die Textgenauigkeit selbst.`;
}
