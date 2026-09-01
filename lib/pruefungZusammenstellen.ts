import { z } from "zod";
import {
  getAnthropicClient,
  PRUEFUNG_ZUSAMMENSTELLEN_MODEL,
  extractJson,
  getTextFromMessage,
} from "./anthropic";
import { WorksheetContent, WorksheetContentSchema, Aufgabe, EXAM_GEEIGNETE_TYPEN } from "./types";
import { vereinfacheArabischeTransliteration } from "./transliteration";
import { normalisierePruefungspunkte } from "./generateWorksheet";
import { UsageEintrag, usageEintragAusAntwort } from "./usageLog";

/**
 * Prüfungs-Modus A ("Aus bestehenden Blättern zusammenstellen", siehe app/klassen) - im
 * Unterschied zu Modus B (generateAndVerifyWorksheet mit istPruefung) wird hier NICHTS neu
 * formuliert: Claude wählt nur aus bereits generierten UND bereits geprüften Aufgaben aus,
 * gewichtet sie mit Punkten und schreibt einen formellen Prüfungskopf. Deutlich weniger
 * Output-Tokens als eine volle Generierung, daher NICHT gegen das Arbeitsblatt-Kontingent
 * verrechnet (siehe app/api/pruefung/zusammenstellen/route.ts) - der Content wurde bereits
 * einmal bezahlt und durch die Verifikations-Stufe geprüft, deshalb läuft dieser Weg auch NICHT
 * erneut durch generateAndVerifyWorksheet's Verifikations-Aufruf.
 */

export interface QuellArbeitsblatt {
  /** Nur zur Fehlermeldung/Zuordnung - keine Worksheet-ID-Semantik nötig. */
  bezeichnung: string;
  content: WorksheetContent;
}

export interface PruefungZusammenstellenOptions {
  quellen: QuellArbeitsblatt[];
  punkteGesamt: number;
  /** Grober thematischer Schwerpunkt als Hinweis an Claude (z.B. Klassen-Themenbereich) - rein
   * beratend, keine harte Filterung, da einzelne Quell-Arbeitsblätter selbst "gemischt" sein
   * können. */
  themenbereichSchwerpunkt?: string;
}

export interface PruefungZusammenstellenResult {
  content: WorksheetContent;
  usage: UsageEintrag[];
}

const AuswahlEintragSchema = z.object({
  index: z.number(),
  punkte: z.number(),
});

const AuswahlAntwortSchema = z.object({
  titel: z.string(),
  einleitung: z.string(),
  auswahl: z.array(AuswahlEintragSchema).min(1),
});

const ZUSAMMENSTELLEN_SYSTEM_PROMPT = `Du hilfst einer Lehrkraft, aus bereits vorhandenen, bereits fachlich geprüften Unterrichtsaufgaben eine formelle PRÜFUNG (Schularbeit/Test) zusammenzustellen - du erfindest KEINE neuen Aufgaben, sondern wählst aus dem gegebenen Kandidatenpool aus.

Kriterien für eine gute Auswahl:
- Thematisch stimmig und in sich abgeschlossen (keine völlig zusammenhanglose Mischung).
- Ausgewogene Anforderungsbereiche - nicht nur die einfachsten Aufgaben, auch anspruchsvollere.
- Angemessener Umfang für die vorgegebene Zielpunktzahl (nicht zu wenige, nicht zu viele Aufgaben).
- Wähle bewusst eine TEILMENGE aus, nicht automatisch alle Kandidaten.

Vergib pro ausgewählter Aufgabe Punkte (ganze Zahl, mindestens 1) - die Summe MUSS exakt der vorgegebenen Zielpunktzahl entsprechen. Gewichte anspruchsvollere Aufgaben höher.

Schreibe außerdem einen formellen Prüfungstitel und eine kurze, formelle Einleitung (Ablauf-/Hilfsmittelhinweis, kein motivierender Übungsblatt-Ton) - antworte ausschließlich auf Deutsch, arabische Begriffe nur diakritikfrei (kein ā/ī/ū/ḥ/ṣ/ḍ/ṭ/ẓ/ʿ/ʾ, einfacher Apostroph ' erlaubt).

Antworte NUR mit einem einzigen JSON-Objekt, ohne Markdown-Codeblock:
{
  "titel": string,
  "einleitung": string,
  "auswahl": [ { "index": number, "punkte": number } ]
}`;

function sammleKandidaten(quellen: QuellArbeitsblatt[]) {
  const erlaubt = new Set<string>(EXAM_GEEIGNETE_TYPEN);
  const kandidaten: {
    index: number;
    quellIdx: number;
    originalNr: number;
    aufgabe: Aufgabe;
  }[] = [];
  quellen.forEach((quelle, quellIdx) => {
    for (const aufgabe of quelle.content.aufgaben) {
      if (!erlaubt.has(aufgabe.typ)) continue;
      kandidaten.push({ index: kandidaten.length, quellIdx, originalNr: aufgabe.nr, aufgabe });
    }
  });
  return kandidaten;
}

export async function stelleZusammen(
  options: PruefungZusammenstellenOptions,
): Promise<PruefungZusammenstellenResult> {
  const kandidaten = sammleKandidaten(options.quellen);
  if (kandidaten.length === 0) {
    throw new Error(
      "Keine prüfungstauglichen Aufgaben in den ausgewählten Arbeitsblättern gefunden. Wähle andere Quell-Arbeitsblätter oder erstelle die Prüfung komplett neu.",
    );
  }

  const kandidatenFuerPrompt = kandidaten.map((k) => ({
    index: k.index,
    typ: k.aufgabe.typ,
    frage: k.aufgabe.frage,
    optionen: k.aufgabe.optionen,
    zuordnungLinks: k.aufgabe.zuordnungLinks,
    zuordnungRechts: k.aufgabe.zuordnungRechts,
    wortliste: k.aufgabe.wortliste,
    reihenfolgeElemente: k.aufgabe.reihenfolgeElemente,
    lesetext: k.aufgabe.lesetext,
    anforderungsbereich: k.aufgabe.anforderungsbereich,
    quelle: options.quellen[k.quellIdx].bezeichnung,
  }));

  const userPrompt = `Zielpunktzahl der Prüfung: ${options.punkteGesamt}
${options.themenbereichSchwerpunkt ? `Thematischer Schwerpunkt (Orientierung, keine harte Vorgabe): ${options.themenbereichSchwerpunkt}\n` : ""}
Kandidatenpool (${kandidaten.length} Aufgaben aus ${options.quellen.length} Arbeitsblatt/Arbeitsblättern):
${JSON.stringify(kandidatenFuerPrompt, null, 2)}`;

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: PRUEFUNG_ZUSAMMENSTELLEN_MODEL,
    max_tokens: 4000,
    system: ZUSAMMENSTELLEN_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawAntwort = extractJson(getTextFromMessage(response));
  const antwort = AuswahlAntwortSchema.parse(rawAntwort);

  const kandidatenNachIndex = new Map(kandidaten.map((k) => [k.index, k]));
  const gewaehlteQuellIdx = new Set<number>();
  const aufgaben: Aufgabe[] = [];
  const loesungen: { nr: number; loesung: string }[] = [];

  antwort.auswahl.forEach((eintrag, i) => {
    const kandidat = kandidatenNachIndex.get(eintrag.index);
    if (!kandidat) return; // ungültiger Index von Claude - überspringen statt abzubrechen
    const neueNr = i + 1;
    aufgaben.push({ ...kandidat.aufgabe, nr: neueNr, punkte: Math.max(1, Math.round(eintrag.punkte)) });
    const quelle = options.quellen[kandidat.quellIdx];
    const originalLoesung = quelle.content.loesungen.find((l) => l.nr === kandidat.originalNr);
    loesungen.push({ nr: neueNr, loesung: originalLoesung?.loesung ?? "Siehe Original-Arbeitsblatt." });
    gewaehlteQuellIdx.add(kandidat.quellIdx);
  });

  if (aufgaben.length === 0) {
    throw new Error("Die Zusammenstellung hat keine gültige Aufgabenauswahl geliefert. Bitte erneut versuchen.");
  }

  const quellen = Array.from(gewaehlteQuellIdx).flatMap((idx) => options.quellen[idx].content.quellen);
  const eindeutigeQuellen = Array.from(new Map(quellen.map((q) => [q.bezeichnung, q])).values());

  let content: WorksheetContent = {
    titel: antwort.titel,
    fach: options.quellen[0].content.fach,
    schulstufe: options.quellen[0].content.schulstufe,
    thema: antwort.titel,
    lernziel: "Wissensüberprüfung zu den behandelten Themen und Kompetenzen.",
    einleitung: antwort.einleitung,
    aufgaben,
    loesungen,
    quellen: eindeutigeQuellen,
  };

  content = vereinfacheArabischeTransliteration(content);
  normalisierePruefungspunkte(content, options.punkteGesamt);
  content = WorksheetContentSchema.parse(content);

  const usage = [usageEintragAusAntwort(PRUEFUNG_ZUSAMMENSTELLEN_MODEL, "zusammenstellung", response.usage)];
  return { content, usage };
}
