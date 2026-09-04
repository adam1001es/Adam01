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
  if (!istZahlendesKonto(user)) redirect("/forum");

  const thread = await prisma.forumThread.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { username: true } },
      antworten: { include: { user: { select: { username: true } } }, orderBy: { createdAt: "asc" } },
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
        <p className="mt-1 text-xs text-slate-500">
          <span dir="auto">{communityAutorLabel(thread.user)}</span> ·{" "}
          {formatiereZeit(thread.createdAt)}
        </p>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm text-slate-700">
          {thread.inhalt}
        </p>
        <div className="mt-4">
          <ForumMeldenButton zielTyp="thread" zielId={thread.id} />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {thread.antworten.map((a) => (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
            <p className="text-xs text-slate-500">
              <span dir="auto">{communityAutorLabel(a.user)}</span> ·{" "}
              {formatiereZeit(a.createdAt)}
            </p>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-slate-700">
              {a.inhalt}
            </p>
            <div className="mt-2">
              <ForumMeldenButton zielTyp="antwort" zielId={a.id} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {user.forumGesperrt ? (
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
