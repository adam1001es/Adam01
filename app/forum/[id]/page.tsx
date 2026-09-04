import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { communityAutorLabel } from "@/lib/community";
import { FORUM_KATEGORIE_LABEL, ForumKategorie, FORUM_GESPERRT_FEHLERTEXT } from "@/lib/forum";
import ForumAntwortForm from "@/components/ForumAntwortForm";
import ForumMeldenButton from "@/components/ForumMeldenButton";
import EigenerBeitragLoeschenButton from "@/components/EigenerBeitragLoeschenButton";
import AvatarKreis from "@/components/AvatarKreis";
import { avatarAnzeige } from "@/lib/profil";
import type { NutzerStatus } from "@/lib/status";

const NUTZER_AVATAR_SELECT = {
  username: true,
  avatarFarbe: true,
  avatarTextFarbe: true,
  avatarKuerzel: true,
  status: true,
} as const;

export const dynamic = "force-dynamic";

function formatiereZeit(datum: Date) {
  return `${datum.toLocaleDateString("de-AT")} ${datum.toLocaleTimeString("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default async function ForumThemaPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  // Lesen ist für alle eingeloggten Konten offen (siehe app/forum/page.tsx) - nur Antworten und
  // Melden bleiben Abo-Konten vorbehalten (kannSchreiben weiter unten).
  const kannSchreiben = istZahlendesKonto(user);

  const thread = await prisma.forumThread.findUnique({
    where: { id: params.id },
    include: {
      user: { select: NUTZER_AVATAR_SELECT },
      antworten: {
        include: { user: { select: NUTZER_AVATAR_SELECT } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!thread) notFound();

  return (
    <main className="mx-auto max-w-3xl">
      <Link
        href="/forum"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-700"
      >
        <ArrowLeft size={15} /> Zurück zum Forum
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-card sm:p-6">
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
          {FORUM_KATEGORIE_LABEL[thread.kategorie as ForumKategorie] ?? thread.kategorie}
        </span>
        <h1 className="mt-2 font-display text-2xl font-semibold text-slate-800">{thread.titel}</h1>
        <div className="mt-1.5 flex items-center gap-2">
          <AvatarKreis
            anzeige={avatarAnzeige(thread.user.avatarKuerzel, thread.user.username)}
            farbe={thread.user.avatarFarbe}
            textFarbe={thread.user.avatarTextFarbe}
            status={thread.user.status as NutzerStatus}
            size={24}
          />
          <p className="text-xs text-slate-500">
            <span dir="auto">{communityAutorLabel(thread.user)}</span> ·{" "}
            {formatiereZeit(thread.createdAt)}
          </p>
        </div>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm text-slate-700">
          {thread.inhalt}
        </p>
        <div className="mt-4 flex items-center gap-4">
          {kannSchreiben && <ForumMeldenButton zielTyp="thread" zielId={thread.id} />}
          {thread.userId === user.id && (
            <EigenerBeitragLoeschenButton typ="thread" id={thread.id} nachLoeschenZu="/forum" />
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {thread.antworten.map((a) => (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <AvatarKreis
                anzeige={avatarAnzeige(a.user.avatarKuerzel, a.user.username)}
                farbe={a.user.avatarFarbe}
                textFarbe={a.user.avatarTextFarbe}
                status={a.user.status as NutzerStatus}
                size={22}
              />
              <p className="text-xs text-slate-500">
                <span dir="auto">{communityAutorLabel(a.user)}</span> ·{" "}
                {formatiereZeit(a.createdAt)}
              </p>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-slate-700">
              {a.inhalt}
            </p>
            <div className="mt-2 flex items-center gap-4">
              {kannSchreiben && <ForumMeldenButton zielTyp="antwort" zielId={a.id} />}
              {a.userId === user.id && (
                <EigenerBeitragLoeschenButton typ="antwort" id={a.id} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {!kannSchreiben ? (
          <p className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 text-center text-sm text-indigo-800">
            Antworten ist nur mit einem Abo möglich - mitlesen kannst du weiterhin jederzeit.
          </p>
        ) : user.forumGesperrt ? (
          <p className="rounded-xl border border-slate-200 bg-surface p-4 text-center text-sm text-slate-500">
            {FORUM_GESPERRT_FEHLERTEXT}
          </p>
        ) : (
          <ForumAntwortForm threadId={thread.id} />
        )}
      </div>
    </main>
  );
}
