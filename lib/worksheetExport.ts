import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { Worksheet } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema, ThemenbereichSchema } from "@/lib/types";
import { THEMENBEREICHE } from "@/lib/curriculum";
import { WorksheetPdfDocument } from "@/lib/pdf/WorksheetPdf";
import { buildWorksheetDocx } from "@/lib/docx/buildWorksheetDocx";
import { sammleBildGeneriertIds } from "@/lib/generiertesBildHelfer";

/** PDF-/Word-Rendering aus einer bereits geladenen Worksheet-Zeile - ausgelagert aus
 * app/api/worksheet/[id]/pdf und /docx, weil dieselbe Logik jetzt auch von den öffentlichen
 * Link-Export-Routen (app/api/blatt/[token]/pdf und /docx, siehe app/blatt/[token]) gebraucht
 * wird: beide Wege unterscheiden sich nur in der Autorisierung (Session vs. Link-Token), nicht
 * im eigentlichen Rendering. */

/** wasserzeichen: NUR von den öffentlichen Link-Export-Routen (app/api/blatt/[token]/pdf|docx)
 * mit true aufgerufen - blendet ein dezentes Domain-Wasserzeichen ein (siehe Wasserzeichen() in
 * WorksheetPdf.tsx bzw. wasserzeichenFooter() in buildWorksheetDocx.ts). Der reguläre
 * Eigentümer-Download (app/api/worksheet/[id]/pdf|docx) ruft ohne diesen Parameter auf und bleibt
 * unverändert werbefrei. */
export async function renderWorksheetPdfBuffer(worksheet: Worksheet, wasserzeichen = false): Promise<Buffer> {
  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const layout = LayoutConfigSchema.parse(JSON.parse(worksheet.layoutConfig));
  const themenbereich = ThemenbereichSchema.catch("gemischt").parse(worksheet.themenbereich);

  const bildIds = sammleBildGeneriertIds(content);
  const generierteBildRows = bildIds.length
    ? await prisma.generatedImage.findMany({ where: { id: { in: bildIds } } })
    : [];
  const generierteBilder = Object.fromEntries(
    generierteBildRows.map((b) => [b.id, `data:image/png;base64,${b.data.toString("base64")}`]),
  );

  const element = React.createElement(WorksheetPdfDocument, {
    content,
    layout,
    themenbereichLabel: THEMENBEREICHE[themenbereich].label,
    erstelltAm: worksheet.createdAt,
    generierteBilder,
    wasserzeichen,
  });
  return renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0]);
}

export async function renderWorksheetDocxBuffer(worksheet: Worksheet, wasserzeichen = false): Promise<Buffer> {
  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const layout = LayoutConfigSchema.parse(JSON.parse(worksheet.layoutConfig));
  const themenbereich = ThemenbereichSchema.catch("gemischt").parse(worksheet.themenbereich);

  const bildIds = sammleBildGeneriertIds(content);
  const generierteBildRows = bildIds.length
    ? await prisma.generatedImage.findMany({ where: { id: { in: bildIds } } })
    : [];
  const generierteBilder = Object.fromEntries(generierteBildRows.map((b) => [b.id, b.data]));

  return buildWorksheetDocx(
    content,
    layout,
    THEMENBEREICHE[themenbereich].label,
    worksheet.createdAt,
    generierteBilder,
    wasserzeichen,
  );
}

export function slugifyTitel(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "arbeitsblatt"
  );
}
