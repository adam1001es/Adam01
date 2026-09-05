import { prisma } from "./prisma";
import {
  JAHRESPLAN_KALENDER_VARIANTEN,
  holeKalenderVariante,
  type JahresplanKalenderVariante,
  type JahresplanKalenderWoche,
} from "./jahresplanKalender";

/** Server-only Ergänzung zu lib/jahresplanKalender.ts: mischt die im Code hinterlegten Varianten
 * mit den admin-hochgeladenen (siehe app/admin/jahresplan-varianten, Prisma-Modell
 * JahresplanVariante) - EIGENE Datei statt in jahresplanKalender.ts selbst, weil dieses Modul
 * Prisma importiert (nur serverseitig lauffähig), jahresplanKalender.ts aber auch von der
 * Client-Komponente components/JahresplanErstellenForm.tsx importiert wird (siehe dort - bekommt
 * die admin-hochgeladenen Varianten stattdessen als Prop vom Server übergeben). */

function ausDbZeile(v: { varianteId: string; label: string; schuljahr: string; wochenJson: string }): JahresplanKalenderVariante {
  return {
    id: v.varianteId,
    label: v.label,
    schuljahr: v.schuljahr,
    wochen: JSON.parse(v.wochenJson) as JahresplanKalenderWoche[],
  };
}

export async function holeAlleVarianten(): Promise<JahresplanKalenderVariante[]> {
  const dbVarianten = await prisma.jahresplanVariante.findMany({ orderBy: { createdAt: "asc" } });
  return [...JAHRESPLAN_KALENDER_VARIANTEN, ...dbVarianten.map(ausDbZeile)];
}

export async function holeKalenderVarianteAsync(id: string): Promise<JahresplanKalenderVariante | null> {
  const hartcodiert = holeKalenderVariante(id);
  if (hartcodiert) return hartcodiert;
  const db = await prisma.jahresplanVariante.findUnique({ where: { varianteId: id } });
  return db ? ausDbZeile(db) : null;
}
