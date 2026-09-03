import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, FileText, FileType2, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema, LayoutConfigSchema, ThemenbereichSchema, Verification } from "@/lib/types";
import WorksheetView from "@/components/WorksheetView";
import VerificationBanner from "@/components/VerificationBanner";
import FavoritButton from "@/components/FavoritButton";
import CommunityFavoritButton from "@/components/CommunityFavoritButton";
import TeilenButton from "@/components/TeilenButton";
import LinkTeilenButton from "@/components/LinkTeilenButton";
import DeleteButton from "@/components/DeleteButton";
import MeldungButton from "@/components/MeldungButton";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { communityAutorLabel } from "@/lib/community";

export const dynamic = "force-dynamic";

export default async function WorksheetPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const worksheet = await prisma.worksheet.findUnique({
    where: { id: params.id },
    include: { user: { select: { username: true } } },
  });
  const istBesitzer = worksheet?.userId === user.id;
  // Fremde Arbeitsblätter sind nur sichtbar, wenn sie für die Community freigegeben sind UND
  // das eigene Konto selbst zahlend ist (siehe app/community, istZahlendesKonto) - Teilen ist
  // bewusst nur unter zahlenden Konten gegenseitig, kein öffentlicher Zugriff.
  const zugriffErlaubt =
    worksheet && (istBesitzer || (worksheet.geteilt && istZahlendesKonto(user)));
  if (!worksheet || !zugriffErlaubt) notFound();

  const content = WorksheetContentSchema.parse(JSON.parse(worksheet.contentJson));
  const layout = LayoutConfigSchema.parse(JSON.parse(worksheet.layoutConfig));
  const verification = JSON.parse(worksheet.verification) as Verification;
  const themenbereich = ThemenbereichSchema.catch("gemischt").parse(worksheet.themenbereich);

  const communityFavorit = !istBesitzer
    ? await prisma.communityFavorit.findUnique({
        where: { userId_worksheetId: { userId: user.id, worksheetId: worksheet.id } },
      })
    : null;

  return (
    <main>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={istBesitzer ? "/" : "/community"}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
        >
          <ArrowLeft size={15} /> {istBesitzer ? "Zur Übersicht" : "Zu den geteilten Arbeitsblättern"}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {istBesitzer ? (
            <FavoritButton worksheetId={worksheet.id} initialFavorit={worksheet.favorit} />
          ) : (
            <CommunityFavoritButton worksheetId={worksheet.id} initialFavorit={!!communityFavorit} />
          )}
          {istBesitzer && istZahlendesKonto(user) && (
            <TeilenButton worksheetId={worksheet.id} initialGeteilt={worksheet.geteilt} />
          )}
          {istBesitzer && (
            <LinkTeilenButton
              worksheetId={worksheet.id}
              initialToken={worksheet.oeffentlicherLinkToken}
            />
          )}
          {istBesitzer && (
            <Link
              href={`/worksheet/${worksheet.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
            >
              <Pencil size={15} /> Bearbeiten
            </Link>
          )}
          <a
            href={`/api/worksheet/${worksheet.id}/pdf`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3.5 py-2 text-sm font-medium text-white shadow-card transition hover:shadow-card-hover"
          >
            <FileText size={15} /> PDF öffnen
          </a>
          <a
            href={`/api/worksheet/${worksheet.id}/docx`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            <FileType2 size={15} /> Word (.docx)
          </a>
          {istBesitzer && (
            <DeleteButton worksheetId={worksheet.id} titel={content.titel} redirectTo="/" variant="button" />
          )}
        </div>
      </div>

      {!istBesitzer && (
        <div className="no-print mb-5 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-sm text-brand-800">
          <Users size={16} className="shrink-0" />
          Geteilt von {communityAutorLabel(worksheet.user!)} - nicht dein eigenes Arbeitsblatt,
          daher nicht bearbeitbar.
        </div>
      )}

      {istBesitzer && (
        <div className="no-print mb-5 flex justify-end">
          <MeldungButton worksheetId={worksheet.id} />
        </div>
      )}

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
