import { prisma } from "@/lib/prisma";

/** Ab wie vielen gleichzeitig laufenden Claude-Aufrufen die App einen Hinweis zeigt (siehe
 * AuslastungHinweis) - reine Info, blockiert nichts. */
const SCHWELLE_VIELE_AKTIV = 50;

/** Ein Eintrag zählt nur so lange mit, wie die längste mögliche Generierung dauern kann (siehe
 * maxDuration in app/api/generate) plus Sicherheitsmarge - falls eine Funktion abstürzt, statt
 * regulär über beendeGenerierung() aufzuräumen (siehe finally-Blöcke dort), verschwindet der
 * verwaiste Eintrag dadurch spätestens hierüber von selbst aus der Zählung, statt die Anzeige für
 * immer zu verfälschen. */
const MAX_ALTER_MINUTEN = 6;

/** Beim Start eines Claude-Aufrufs zu rufen (siehe app/api/generate, app/api/pruefung/zusammenstellen)
 * - gibt die ID des Eintrags zurück, die anschließend an beendeGenerierung() übergeben wird. */
export async function starteGenerierung(): Promise<string> {
  const eintrag = await prisma.aktiveGenerierung.create({ data: {} });
  return eintrag.id;
}

/** Immer in einem finally-Block aufrufen, damit der Eintrag auch bei einem Fehler in der
 * Generierung wieder verschwindet. Schluckt eigene Fehler bewusst - ein fehlgeschlagenes
 * Aufräumen darf die eigentliche Antwort an die Lehrkraft nicht verhindern. */
export async function beendeGenerierung(id: string): Promise<void> {
  try {
    await prisma.aktiveGenerierung.delete({ where: { id } });
  } catch {
    // Eintrag ggf. schon durch MAX_ALTER_MINUTEN-Filter irrelevant oder bereits gelöscht - egal.
  }
}

export interface Auslastung {
  aktiv: number;
  viele: boolean;
}

/** Für die Anzeige VOR dem Absenden (siehe app/new, app/klassen/[id]/pruefung-zusammenstellen) -
 * rein informativ, verhindert nichts. */
export async function holeAuslastung(): Promise<Auslastung> {
  const grenze = new Date(Date.now() - MAX_ALTER_MINUTEN * 60 * 1000);
  const aktiv = await prisma.aktiveGenerierung.count({ where: { startedAt: { gte: grenze } } });
  return { aktiv, viele: aktiv >= SCHWELLE_VIELE_AKTIV };
}
