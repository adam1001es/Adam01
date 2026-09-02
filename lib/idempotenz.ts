import crypto from "crypto";
import { prisma } from "./prisma";
import { GenerateRequest } from "./types";

/**
 * Verhindert ein doppelt erzeugtes Arbeitsblatt, wenn dieselbe Anfrage nach einem
 * Verbindungsabbruch erneut abgeschickt wird (siehe app/api/generate/route.ts) - real
 * beobachtet: eine Lehrkraft bekam nach einem Netzwerkfehler "Load failed", war unsicher ob die
 * Erstellung durchgelaufen war, und hätte ohne diesen Schutz beim erneuten Klicken versehentlich
 * ein zweites, identisches Arbeitsblatt erzeugt (und dabei ein zweites Mal Kontingent verbraucht).
 *
 * Bewusst NICHT wasserdicht gegen zwei echt gleichzeitige (Millisekunden auseinander liegende)
 * identische Anfragen - kein DB-Lock/Unique-Constraint, nur ein einfacher Lese-dann-Schreibe-
 * Check. Das reale Muster (Klick, Verbindungsabbruch, erneuter Klick nach Sekunden bis wenigen
 * Minuten Unsicherheit) liegt weit genug auseinander, um zuverlässig erkannt zu werden - ein
 * echtes Duplikat aus zwei zeitgleichen Browser-Tabs bliebe ein Randfall.
 */

const ZEITFENSTER_MINUTEN = 5;

/** Baut einen stabilen Hash aus den inhaltlich relevanten Feldern einer Generierungsanfrage -
 * identischer Hash = derselbe Wunsch (unveränderte Einstellungen erneut abgeschickt),
 * unterschiedlicher Hash = ein neuer, eigenständiger Wunsch (z.B. andere Schulstufe gewählt).
 * Feste Feldreihenfolge statt JSON.stringify(req) direkt, um nicht von der Objektschlüssel-
 * Reihenfolge des geparsten Zod-Objekts abhängig zu sein. */
export function berechneRequestHash(req: GenerateRequest, userId: string): string {
  const kanonisch = JSON.stringify({
    userId,
    bereich: req.bereich,
    thema: req.thema,
    schulstufe: req.schulstufe,
    themenbereich: req.themenbereich,
    zieldauerMinuten: req.zieldauerMinuten,
    komplexitaet: req.komplexitaet,
    aufgabentypen: [...req.aufgabentypen].sort(),
    zusatzhinweise: req.zusatzhinweise ?? "",
    istPruefung: req.istPruefung,
    punkteGesamt: req.punkteGesamt ?? null,
    klasseId: req.klasseId ?? null,
    koranFokus: req.koranFokus ?? null,
    layout: req.layout,
  });
  return crypto.createHash("sha256").update(kanonisch).digest("hex");
}

export type AnfrageDedupErgebnis =
  | { art: "neu"; anfrageId: string }
  | { art: "laeuft" }
  | { art: "fertig"; worksheetId: string };

/** Prüft, ob derselbe Wunsch (gleicher Hash) für diesen Nutzer innerhalb des Zeitfensters bereits
 * läuft/fertig ist, und legt andernfalls selbst einen neuen "läuft"-Merker an. Bekannte
 * Einschränkung: wird VOR der eigentlichen Generierung aufgerufen, aber NACH den Kontingent-/
 * Klassen-Prüfungen in der Route - scheitert eine identische Anfrage knapp am Kontingent, weil
 * der ORIGINAL-Versuch es gerade erst verbraucht hat, wird das (seltene) Retry fälschlich wie ein
 * neuer Versuch behandelt statt als "eigentlich schon fertig" erkannt. Für den beobachteten Fall
 * (Verbindungsabbruch VOR erschöpftem Kontingent) ist das nicht relevant. */
export async function starteOderErkenneDuplikat(
  userId: string,
  requestHash: string,
): Promise<AnfrageDedupErgebnis> {
  const cutoff = new Date(Date.now() - ZEITFENSTER_MINUTEN * 60 * 1000);
  const bestehende = await prisma.generierungsAnfrage.findFirst({
    where: { userId, requestHash, createdAt: { gte: cutoff } },
    orderBy: { createdAt: "desc" },
  });
  if (bestehende?.status === "fertig" && bestehende.worksheetId) {
    return { art: "fertig", worksheetId: bestehende.worksheetId };
  }
  if (bestehende?.status === "laeuft") {
    return { art: "laeuft" };
  }
  const neu = await prisma.generierungsAnfrage.create({
    data: { userId, requestHash, status: "laeuft" },
  });
  return { art: "neu", anfrageId: neu.id };
}

export async function markiereAnfrageFertig(anfrageId: string, worksheetId: string) {
  await prisma.generierungsAnfrage.update({
    where: { id: anfrageId },
    data: { status: "fertig", worksheetId },
  });
}

export async function markiereAnfrageFehlgeschlagen(anfrageId: string) {
  await prisma.generierungsAnfrage.update({
    where: { id: anfrageId },
    data: { status: "fehlgeschlagen" },
  });
}
