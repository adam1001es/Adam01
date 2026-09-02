import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { THEMENBEREICH_KEYS } from "@/lib/curriculum";
import {
  legeWissensEntwurfAn,
  WISSENS_TYPEN,
  ZitatInhaltSchema,
  MusteraufgabeInhaltSchema,
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

  const inhaltSchema = parsed.data.typ === "zitat" ? ZitatInhaltSchema : MusteraufgabeInhaltSchema;
  const inhaltParsed = inhaltSchema.safeParse(parsed.data.inhalt);
  if (!inhaltParsed.success) {
    return NextResponse.json(
      { error: `Ungültiger Inhalt: ${inhaltParsed.error.errors[0]?.message}` },
      { status: 400 },
    );
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
