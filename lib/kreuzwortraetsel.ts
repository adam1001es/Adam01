import { normalisiereWort } from "./wortsuche";

/**
 * Erzeugt aus Hinweis/Antwort-Paaren (von Claude vorgeschlagen) ein klassisches, nummeriertes
 * Kreuzworträtsel-Gitter - bewusst NICHT von Claude selbst layouten lassen (siehe
 * lib/wortsuche.ts für dieselbe Begründung). Wird EINMALIG serverseitig direkt nach der
 * Generierung aufgelöst und das Ergebnis in der Aufgabe gespeichert, damit Web/PDF/Word exakt
 * dasselbe Gitter zeigen und die Lösung (Nummern!) garantiert korrekt ist - Claude kennt beim
 * Schreiben von "loesungen" die finale Nummerierung noch nicht, daher wird die Lösung für diese
 * Aufgabe serverseitig aus dem Ergebnis neu geschrieben (siehe generateWorksheet.ts).
 */

export interface KreuzwortZelle {
  buchstabe: string;
  nummer: number | null;
}

export interface KreuzwortHinweis {
  nummer: number;
  hinweis: string;
  antwort: string;
}

export interface KreuzwortErgebnis {
  gitter: (KreuzwortZelle | null)[][];
  waagerecht: KreuzwortHinweis[];
  senkrecht: KreuzwortHinweis[];
}

type Richtung = "h" | "v";

interface Platzierung {
  row: number;
  col: number;
  richtung: Richtung;
  wort: string;
  hinweis: string;
}

export function erzeugeKreuzwortraetsel(
  eintraegeRoh: { frage: string; antwort: string }[],
): KreuzwortErgebnis | null {
  const eintraege = eintraegeRoh
    .map((e) => ({ hinweis: e.frage, antwort: normalisiereWort(e.antwort) }))
    .filter((e) => e.antwort.length >= 3 && e.antwort.length <= 14)
    .sort((a, b) => b.antwort.length - a.antwort.length);
  if (eintraege.length === 0) return null;

  // Großzügig genug, damit selbst Wörter ohne jede gemeinsame Buchstaben (siehe Fallback unten,
  // dann je eine eigene Zeile) noch Platz finden.
  const RASTER_GROESSE = 25 + eintraege.length * 2;
  const mitte = Math.floor(RASTER_GROESSE / 2);
  const gitter: (string | null)[][] = Array.from({ length: RASTER_GROESSE }, () =>
    Array(RASTER_GROESSE).fill(null),
  );

  function zelle(r: number, c: number): string | null {
    if (r < 0 || r >= RASTER_GROESSE || c < 0 || c >= RASTER_GROESSE) return null;
    return gitter[r][c];
  }

  function passt(row: number, col: number, richtung: Richtung, wort: string): boolean {
    for (let i = 0; i < wort.length; i++) {
      const r = richtung === "v" ? row + i : row;
      const c = richtung === "h" ? col + i : col;
      if (r < 0 || r >= RASTER_GROESSE || c < 0 || c >= RASTER_GROESSE) return false;
      const bestehend = gitter[r][c];
      if (bestehend !== null && bestehend !== wort[i]) return false;
      // Quer zur Richtung müssen die Nachbarzellen frei sein, außer an dieser Stelle steht schon
      // genau der richtige Buchstabe (= echte Kreuzung) - verhindert, dass Wörter versehentlich
      // parallel aneinanderkleben.
      if (bestehend === null) {
        if (richtung === "h") {
          if (zelle(r - 1, c) !== null || zelle(r + 1, c) !== null) return false;
        } else {
          if (zelle(r, c - 1) !== null || zelle(r, c + 1) !== null) return false;
        }
      }
    }
    // Direkt vor/nach dem Wort muss ebenfalls Platz sein, sonst würden zwei Wörter ineinander
    // ohne Trennung übergehen.
    const vorR = richtung === "v" ? row - 1 : row;
    const vorC = richtung === "h" ? col - 1 : col;
    const nachR = richtung === "v" ? row + wort.length : row;
    const nachC = richtung === "h" ? col + wort.length : col;
    if (zelle(vorR, vorC) !== null) return false;
    if (zelle(nachR, nachC) !== null) return false;
    return true;
  }

  function platziere(row: number, col: number, richtung: Richtung, wort: string): void {
    for (let i = 0; i < wort.length; i++) {
      const r = richtung === "v" ? row + i : row;
      const c = richtung === "h" ? col + i : col;
      gitter[r][c] = wort[i];
    }
  }

  const platzierungen: Platzierung[] = [];

  const erstes = eintraege[0];
  const ersteCol = mitte - Math.floor(erstes.antwort.length / 2);
  platziere(mitte, ersteCol, "h", erstes.antwort);
  platzierungen.push({ row: mitte, col: ersteCol, richtung: "h", wort: erstes.antwort, hinweis: erstes.hinweis });

  for (let idx = 1; idx < eintraege.length; idx++) {
    const { antwort, hinweis } = eintraege[idx];
    let beste: { row: number; col: number; richtung: Richtung } | null = null;

    aussen: for (const p of platzierungen) {
      for (let i = 0; i < p.wort.length; i++) {
        for (let j = 0; j < antwort.length; j++) {
          if (p.wort[i] !== antwort[j]) continue;
          const neueRichtung: Richtung = p.richtung === "h" ? "v" : "h";
          const row = p.richtung === "h" ? p.row - j : p.row + i;
          const col = p.richtung === "h" ? p.col + i : p.col - j;
          if (passt(row, col, neueRichtung, antwort)) {
            beste = { row, col, richtung: neueRichtung };
            break aussen;
          }
        }
      }
    }

    if (beste) {
      platziere(beste.row, beste.col, beste.richtung, antwort);
      platzierungen.push({ ...beste, wort: antwort, hinweis });
    } else {
      // Keine Kreuzung mit bereits platzierten Wörtern möglich (z.B. keine gemeinsamen
      // Buchstaben) - statt das Wort stillschweigend zu verwerfen, wird es in einer eigenen,
      // freien Zeile unterhalb des bisherigen Rätsels platziert (nicht verbunden, aber sichtbar
      // und lösbar).
      let fallbackRow = Math.max(...platzierungen.map((p) => (p.richtung === "v" ? p.row + p.wort.length : p.row))) + 1;
      const fallbackCol = mitte - Math.floor(antwort.length / 2);
      while (fallbackRow < RASTER_GROESSE && !passt(fallbackRow, fallbackCol, "h", antwort)) {
        fallbackRow++;
      }
      // Bei der großzügig bemessenen Rastergröße (siehe oben) findet sich hier praktisch immer
      // Platz; nur im theoretischen Extremfall bliebe das Wort unplatziert.
      if (fallbackRow < RASTER_GROESSE) {
        platziere(fallbackRow, fallbackCol, "h", antwort);
        platzierungen.push({ row: fallbackRow, col: fallbackCol, richtung: "h", wort: antwort, hinweis });
      }
    }
  }

  if (platzierungen.length === 0) return null;

  let minRow = RASTER_GROESSE;
  let maxRow = -1;
  let minCol = RASTER_GROESSE;
  let maxCol = -1;
  for (let r = 0; r < RASTER_GROESSE; r++) {
    for (let c = 0; c < RASTER_GROESSE; c++) {
      if (gitter[r][c] !== null) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  const zugeschnitten: (string | null)[][] = [];
  for (let r = minRow; r <= maxRow; r++) {
    zugeschnitten.push(gitter[r].slice(minCol, maxCol + 1));
  }
  const hoehe = zugeschnitten.length;
  const breite = zugeschnitten[0].length;

  function zugeschnitteneZelle(r: number, c: number): string | null {
    if (r < 0 || r >= hoehe || c < 0 || c >= breite) return null;
    return zugeschnitten[r][c];
  }

  const nummern = new Map<string, number>();
  let naechsteNummer = 1;
  for (let r = 0; r < hoehe; r++) {
    for (let c = 0; c < breite; c++) {
      if (zugeschnitten[r][c] === null) continue;
      const startWaagerecht = zugeschnitteneZelle(r, c - 1) === null && zugeschnitteneZelle(r, c + 1) !== null;
      const startSenkrecht = zugeschnitteneZelle(r - 1, c) === null && zugeschnitteneZelle(r + 1, c) !== null;
      if (startWaagerecht || startSenkrecht) {
        nummern.set(`${r},${c}`, naechsteNummer++);
      }
    }
  }

  const gitterMitNummern: (KreuzwortZelle | null)[][] = zugeschnitten.map((zeile, r) =>
    zeile.map((buchstabe, c) =>
      buchstabe === null ? null : { buchstabe, nummer: nummern.get(`${r},${c}`) ?? null },
    ),
  );

  const waagerecht: KreuzwortHinweis[] = [];
  const senkrecht: KreuzwortHinweis[] = [];
  for (const p of platzierungen) {
    const row = p.row - minRow;
    const col = p.col - minCol;
    const nummer = nummern.get(`${row},${col}`);
    if (nummer === undefined) continue;
    const eintrag = { nummer, hinweis: p.hinweis, antwort: p.wort };
    if (p.richtung === "h") waagerecht.push(eintrag);
    else senkrecht.push(eintrag);
  }
  waagerecht.sort((a, b) => a.nummer - b.nummer);
  senkrecht.sort((a, b) => a.nummer - b.nummer);

  return { gitter: gitterMitNummern, waagerecht, senkrecht };
}
