import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { THEMENBEREICH_KEYS } from "@/lib/curriculum";
import {
  legeWissensEntwurfAn,
  findeVorhandenesZitat,
  findeVorhandenenBegriff,
  WISSENS_TYPEN,
  WISSENS_STATUS_LABEL,
  ZitatInhaltSchema,
  MusteraufgabeInhaltSchema,
  BegriffInhaltSchema,
} from "@/lib/wissensbasis";

const BodySchema = z.object({
  typ: z.enum(WISSENS_TYPEN),
  themenbereich: z.enum(THEMENBEREICH_KEYS),
  schulstufeCluster: z.string().nullable().optional(),
  inhalt: z.record(z.unknown()),
  rechercheNotiz: z.string().optional(),
});

/** Manuelles Anlegen eines Wissensbasis-Eintrags durch den Admin selbst (z.B. ein Zitat, das er
 * ohne Umweg über das Mining direkt einträgt) - landet wie jeder andere Eintrag zunächst als
 * "entwurf" (siehe legeWissensEntwurfAn), auch hier gibt es keine Möglichkeit, direkt mit Status
 * "geprueft" anzulegen. */
export async function POST(request: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON im Request-Body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Ungültiger Body." },
      { status: 400 },
    );
  }

  const inhaltSchema =
    parsed.data.typ === "zitat"
      ? ZitatInhaltSchema
      : parsed.data.typ === "begriff"
        ? BegriffInhaltSchema
        : MusteraufgabeInhaltSchema;
  const inhaltParsed = inhaltSchema.safeParse(parsed.data.inhalt);
  if (!inhaltParsed.success) {
    return NextResponse.json(
      { error: `Ungültiger Inhalt: ${inhaltParsed.error.errors[0]?.message}` },
      { status: 400 },
    );
  }

  // Verhindert doppelt angelegte Zitate/Begriffe - z.B. wenn ein Link-Import (lib/linkImport.ts)
  // nach Anpassungen erneut übernommen wird, dasselbe Koran-Nachschlage-Ergebnis zweimal auf
  // "Als Entwurf übernehmen" geklickt wird, oder ein Begriff (z.B. "Siyam") beim Aufbau des
  // Glossars aus Versehen ein zweites Mal eingetragen wird. Bei "musteraufgabe" gibt es kein
  // vergleichbares Bezeichnungs-Feld, mehrere ähnliche Beispielaufgaben sind dort auch kein
  // Problem.
  if (parsed.data.typ === "zitat") {
    const bezeichnung = (inhaltParsed.data as { bezeichnung?: string }).bezeichnung ?? "";
    const vorhanden = await findeVorhandenesZitat(bezeichnung);
    if (vorhanden) {
      return NextResponse.json(
        {
          error: `Ein Zitat mit dieser Bezeichnung existiert bereits in der Wissensbasis (Status: ${WISSENS_STATUS_LABEL[vorhanden.status]}).`,
          duplikatId: vorhanden.id,
        },
        { status: 409 },
      );
    }
  } else if (parsed.data.typ === "begriff") {
    const begriff = (inhaltParsed.data as { begriff?: string }).begriff ?? "";
    const vorhanden = await findeVorhandenenBegriff(begriff);
    if (vorhanden) {
      return NextResponse.json(
        {
          error: `Dieser Begriff existiert bereits in der Wissensbasis (Status: ${WISSENS_STATUS_LABEL[vorhanden.status]}).`,
          duplikatId: vorhanden.id,
        },
        { status: 409 },
      );
    }
  }

  const eintrag = await legeWissensEntwurfAn({
    typ: parsed.data.typ,
    themenbereich: parsed.data.themenbereich,
    schulstufeCluster: parsed.data.schulstufeCluster,
    inhalt: inhaltParsed.data,
    rechercheNotiz: parsed.data.rechercheNotiz,
  });

  return NextResponse.json({ id: eintrag.id }, { status: 201 });
}
