/**
 * Live-Anbindung an die Al-Quran-Cloud-API (https://alquran.cloud/api) statt den Korantext
 * selbst zu speichern oder aus dem Gedächtnis zu reproduzieren - der arabische Urtext ist zwar
 * gemeinfrei, eine deutsche ÜBERSETZUNG (hier: Bubenheim & Elyas, Edition "de.bubenheim") ist
 * aber ein eigenständiges, urheberrechtlich geschütztes Werk. Die API liefert sie mit Erlaubnis
 * der Rechteinhaber bereitgestellt und live pro Anfrage aus - wir übernehmen aus einem Treffer
 * gezielt nur die vom Admin ausgewählten einzelnen Verse in die Wissensbasis (siehe
 * app/admin/wissensbasis, lib/wissensbasis.ts), nie den kompletten Text auf Vorrat.
 */

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
