import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  AufgabeErgaenzenRequestSchema,
  WorksheetContentSchema,
  ThemenbereichSchema,
  AUFGABEN_TYP_MAXIMUM,
} from "@/lib/types";
import {
  generiereZusaetzlicheAufgabe,
  getAufgabeErgaenzenStatus,
  incrementAufgabeErgaenzenUsage,
  AUFGABE_ERGAENZEN_TAGESLIMIT,
  AUFGABE_ERGAENZEN_PRO_ARBEITSBLATT_MAXIMUM,
} from "@/lib/aufgabeErgaenzen";
import { speichereUsage } from "@/lib/usageLog";

/** Ergänzt EINE zusätzliche, per KI erstellte Aufgabe zu einem bereits bestehenden Arbeitsblatt
 * (siehe EditWorksheetForm.tsx "Aufgabe von KI erstellen") - eigenständige, kontingentfreie
 * Funktion, NICHT Teil des normalen Arbeitsblatt-Kontingents (lib/quota.ts): es entsteht kein
 * neues Arbeitsblatt, nur eine Ergänzung zu einem bereits (ggf. kostenpflichtig) erstellten.
 * Zwei unabhängige Limits (siehe lib/aufgabeErgaenzen.ts): pro Arbeitsblatt höchstens
 * AUFGABE_ERGAENZEN_PRO_ARBEITSBLATT_MAXIMUM (die eigentliche Missbrauchsbremse), zusätzlich ein
 * lockereres Tageslimit über alle Arbeitsblätter hinweg. Ändert das Arbeitsblatt selbst NICHT -
 * liefert nur die neue Aufgabe zurück, das tatsächliche Speichern läuft weiterhin über PATCH
 * /api/worksheet/[id] beim regulären "Änderungen speichern"; der Zähler wird trotzdem schon HIER
 * erhöht (nicht erst beim Speichern), da bereits der Claude-Aufruf selbst die Kosten verursacht,
 * die begrenzt werden sollen - unabhängig davon, ob die Lehrkraft das Ergebnis am Ende übernimmt. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  }

  const worksheet = await prisma.worksheet.findUnique({ where: { id: params.id } });
  if (!worksheet || worksheet.userId !== user.id) {
    return NextResponse.json({ error: "Arbeitsblatt nicht gefunden." }, { status: 404 });
  }

  // Schließt eine Kontingent-Lücke: ausgabeform "text" (siehe GenerateRequestSchema,
  // app/api/generate/route.ts erzeugeKoranText/erzeugeHadithText) ist bewusst UNMETERED - reiner,
  // bereits fertig geprüfter Koran-/Hadith-Wortlaut ohne jeden Claude-Aufruf, kostet daher kein
  // Kontingent. Ohne diese Sperre könnte ein Konto beliebig viele kostenlose "Nur Text"-Blätter
  // erzeugen und darauf jeweils per KI generierte Aufgaben ergänzen - echte, kostenpflichtige
  // Claude-Nutzung, für die nie ein Arbeitsblatt-Kontingent verbraucht wurde. Für "arbeitsblatt"
  // (auch mit Koran-/Hadith-Fokus) greift diese Sperre nicht - das lief bereits durch die volle,
  // kontingentpflichtige Generierung.
  if (worksheet.ausgabeform !== "arbeitsblatt") {
    return NextResponse.json(
      {
        error:
          "Diese Funktion ist nur für vollständige Arbeitsblätter mit KI-generierten Aufgaben verfügbar, nicht für den reinen Koran-/Hadith-Text (kein Kontingent verbraucht).",
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = AufgabeErgaenzenRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const req = parsed.data;

  const istAdmin = user.role === "admin";

  if (!istAdmin && worksheet.aufgabeErgaenzenAnzahl >= AUFGABE_ERGAENZEN_PRO_ARBEITSBLATT_MAXIMUM) {
    return NextResponse.json(
      {
        error: `"Aufgabe von KI erstellen" wurde für dieses Arbeitsblatt bereits ${AUFGABE_ERGAENZEN_PRO_ARBEITSBLATT_MAXIMUM}× genutzt (Höchstgrenze pro Arbeitsblatt).`,
      },
      { status: 429 },
    );
  }

  const status = istAdmin ? null : await getAufgabeErgaenzenStatus(user.id);
  if (status && status.verbleibend <= 0) {
    return NextResponse.json(
      {
        error: `Tageslimit für "Aufgabe von KI erstellen" erreicht (${AUFGABE_ERGAENZEN_TAGESLIMIT}/Tag). Morgen wieder verfügbar.`,
      },
      { status: 429 },
    );
  }

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const themenbereich = ThemenbereichSchema.catch("gemischt").parse(worksheet.themenbereich);

  // Serverseitige Grenze analog zu begrenzeAufgabenProTyp (lib/generateWorksheet.ts) - "sortierkarten"
  // und "recherche_auftrag" sind für sich schon umfangreich, davon macht auch bei nachträglichem
  // Ergänzen höchstens 1 pro Arbeitsblatt Sinn. Wird im Formular zwar bereits durch Deaktivieren
  // der Option verhindert, hier zusätzlich hart geprüft, falls die Anfrage direkt erfolgt.
  const maximum = AUFGABEN_TYP_MAXIMUM[req.aufgabentyp];
  if (maximum !== undefined) {
    const vorhanden = content.aufgaben.filter((a) => a.typ === req.aufgabentyp).length;
    if (vorhanden >= maximum) {
      return NextResponse.json(
        {
          error: `Dieses Arbeitsblatt hat bereits die maximal sinnvolle Anzahl (${maximum}) an Aufgaben vom Typ "${req.aufgabentyp}".`,
        },
        { status: 400 },
      );
    }
  }

  try {
    const { aufgabe, loesung, usage } = await generiereZusaetzlicheAufgabe(content, themenbereich, req);
    await speichereUsage(usage, user.id, worksheet.id);

    let verbleibendProArbeitsblatt: number | null = null;
    if (!istAdmin) {
      await incrementAufgabeErgaenzenUsage(user.id);
      const aktualisiert = await prisma.worksheet.update({
        where: { id: worksheet.id },
        data: { aufgabeErgaenzenAnzahl: { increment: 1 } },
        select: { aufgabeErgaenzenAnzahl: true },
      });
      verbleibendProArbeitsblatt = Math.max(
        0,
        AUFGABE_ERGAENZEN_PRO_ARBEITSBLATT_MAXIMUM - aktualisiert.aufgabeErgaenzenAnzahl,
      );
    }
    const verbleibend = istAdmin ? null : Math.max(0, (status?.verbleibend ?? AUFGABE_ERGAENZEN_TAGESLIMIT) - 1);

    return NextResponse.json({ aufgabe, loesung, verbleibend, verbleibendProArbeitsblatt });
  } catch (err) {
    console.error("Fehler beim Ergänzen einer Aufgabe:", err);
    const message = err instanceof Error ? err.message : "Aufgabe konnte nicht erstellt werden.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
