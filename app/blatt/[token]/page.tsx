import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { FileText, FileType2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema, ThemenbereichSchema, Verification } from "@/lib/types";
import WorksheetView from "@/components/WorksheetView";
import VerificationBanner from "@/components/VerificationBanner";

export const dynamic = "force-dynamic";

/** Titel/Beschreibung der Link-Vorschaukarte (WhatsApp, iMessage, ...) auf das konkrete
 * Arbeitsblatt zuschneiden, statt der generischen "Lernwerk Hilal"-Beschreibung aus app/layout.tsx -
 * sonst sieht die Lehrkraft in der eigenen Chat-Historie nur noch "Lernwerk Hilal" und weiß später
 * nicht mehr, welches Arbeitsblatt sie wem geschickt hat. Übernimmt das geerbte openGraph/
 * twitter-Objekt vom Eltern-Metadata (per "parent"-Parameter) und überschreibt darin NUR
 * title/description - ein komplett neues openGraph/twitter-Objekt würde sonst das automatisch
 * eingebundene Vorschaubild (app/opengraph-image.tsx) und den twitter:card-Typ unbemerkt
 * verwerfen, da Next.js diese Objekte pro Route ersetzt statt feldweise zusammenzuführen. Bei
 * ungültigem/widerrufenem Token bewusst {} zurückgeben (nicht notFound() hier aufrufen) - die
 * generische Metadata für die 404-Seite reicht, der eigentliche 404 passiert in der Seite
 * selbst. */
export async function generateMetadata(
  { params }: { params: { token: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const worksheet = await prisma.worksheet.findUnique({
    where: { oeffentlicherLinkToken: params.token },
    select: { contentJson: true },
  });
  if (!worksheet) return {};

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const titel = `${content.titel} - Lernwerk Hilal`;
  const beschreibung = `${content.fach} · ${content.schulstufe} · Thema: ${content.thema}`;
  // Nur "images" wird vom Eltern-Metadata übernommen (die einzige Stelle, die tatsächlich
  // dynamisch generiert wird, inkl. Cache-Busting-Query - siehe app/opengraph-image.tsx); Typ,
  // siteName und Locale sind ohnehin dieselben statischen Werte wie in app/layout.tsx und werden
  // hier direkt gesetzt, um die Null/Undefined-Konflikte des aufgelösten Metadata-Typs zu
  // vermeiden.
  const { openGraph, twitter } = await parent;
  return {
    title: titel,
    description: beschreibung,
    openGraph: {
      title: titel,
      description: beschreibung,
      images: openGraph?.images,
      siteName: "Lernwerk Hilal",
      locale: "de_AT",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titel,
      description: beschreibung,
      images: twitter?.images,
    },
  };
}

/** Öffentliche, NICHT angemeldete Ansicht eines Arbeitsblatts über einen Link-Token (siehe
 * Worksheet.oeffentlicherLinkToken, app/api/worksheet/[id]/link, components/LinkTeilenButton.tsx)
 * - Gegenstück zu app/worksheet/[id]/page.tsx, aber bewusst ohne getSessionUser()-Gate und ohne
 * Besitzer-Aktionen (Bearbeiten/Löschen/Community-Teilen): wer den Link hat, sieht nur das
 * Arbeitsblatt selbst plus PDF-/Word-Export. Ein widerrufener oder nie aktivierter Token führt zu
 * notFound(), da findUnique dann keine Zeile trifft (kein separates "aktiv"-Flag nötig - siehe
 * Schema-Kommentar). */
export default async function OeffentlichesBlattPage({ params }: { params: { token: string } }) {
  const worksheet = await prisma.worksheet.findUnique({
    where: { oeffentlicherLinkToken: params.token },
  });
  if (!worksheet) notFound();

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const layout = LayoutConfigSchema.parse(JSON.parse(worksheet.layoutConfig));
  const verification = JSON.parse(worksheet.verification) as Verification;
  const themenbereich = ThemenbereichSchema.catch("gemischt").parse(worksheet.themenbereich);

  return (
    <main>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Über einen geteilten Link geöffnet -{" "}
          <Link href="/" className="font-medium text-brand-600 hover:underline">
            mehr über Lernwerk Hilal
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/blatt/${params.token}/pdf`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3.5 py-2 text-sm font-medium text-white shadow-card transition hover:shadow-card-hover"
          >
            <FileText size={15} /> PDF öffnen
          </a>
          <a
            href={`/api/blatt/${params.token}/docx`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            <FileType2 size={15} /> Word (.docx)
          </a>
        </div>
      </div>

      <VerificationBanner verification={verification} />

      <WorksheetView
        content={content}
        layout={layout}
        themenbereich={themenbereich}
        erstelltAm={worksheet.createdAt}
      />
    </main>
  );
}
