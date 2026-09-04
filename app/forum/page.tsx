import { redirect } from "next/navigation";
import Link from "next/link";
import { MessagesSquare, Lock, Plus, MessageCircle, Users, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { communityAutorLabel } from "@/lib/community";
import { FORUM_KATEGORIEN, FORUM_KATEGORIE_LABEL, ForumKategorie } from "@/lib/forum";
import { avatarAnzeige } from "@/lib/profil";
import type { NutzerStatus } from "@/lib/status";
import AvatarKreis from "@/components/AvatarKreis";

export const dynamic = "force-dynamic";

/** Übersicht des Lehrkräfte-Forums (siehe app/forum/[id] für ein einzelnes Thema, app/forum/chat
 * für den Live-Chat) - wie Community/Klassen nur für Abo-Konten (istZahlendesKonto). */
export default async function ForumPage({
  searchParams,
}: {
  searchParams: { kategorie?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Bewusst KEIN Zugriffs-Lock mehr für das Lesen (siehe app/forum/[id]/page.tsx,
  // app/forum/chat/page.tsx): kostenlose Konten sollen sehen, was sie mit einem Abo bekommen
  // würden, statt nur eine leere Hinweiskarte - nur das SCHREIBEN (neues Thema, Antworten, Chat)
  // bleibt Abo-Konten vorbehalten (istZahlendesKonto weiter unten nur noch für "Neues Thema").
  const kannSchreiben = istZahlendesKonto(user);

  const kategorieFilter = FORUM_KATEGORIEN.includes(searchParams.kategorie as ForumKategorie)
    ? (searchParams.kategorie as ForumKategorie)
    : null;

  const themen = await prisma.forumThread.findMany({
    where: kategorieFilter ? { kategorie: kategorieFilter } : {},
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          username: true,
          avatarFarbe: true,
          avatarTextFarbe: true,
          avatarKuerzel: true,
          status: true,
        },
      },
      _count: { select: { antworten: true } },
    },
    take: 300,
  });

  return (
    <main>
      <div className="relative overflow-hidden rounded-2xl bg-forum-gradient px-6 py-8 shadow-card-forum sm:px-9 sm:py-10">
        <div className="max-w-2xl">
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-semibold text-white sm:text-4xl">
            <MessagesSquare size={28} strokeWidth={2} /> Forum
          </h1>
          <p className="mt-2 text-sm text-indigo-50/90 sm:text-base">
            Austausch unter Kolleg:innen - Erfahrungen, Unterrichtsmethoden und aktuelle Themen.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {kannSchreiben ? (
              <Link
                href="/forum/neu"
                className="inline-flex items-center gap-2 rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-card transition hover:bg-indigo-50"
              >
                <Plus size={17} strokeWidth={2.5} /> Neues Thema
              </Link>
            ) : (
              <span
                title="Neues Thema eröffnen ist nur mit einem Abo möglich"
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white/70"
              >
                <Lock size={15} strokeWidth={2.25} /> Neues Thema
              </span>
            )}
            <Link
              href="/forum/chat"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <MessageCircle size={17} strokeWidth={2.25} /> Zum Chat
            </Link>
          </div>
        </div>
      </div>

      {!kannSchreiben && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-3.5 text-sm text-indigo-800">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <p>
            Du kannst hier alles lesen - Themen, Antworten und den Chat. Selbst schreiben (neues
            Thema, Antworten, Chat-Nachrichten) ist nur mit einem Abo möglich.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/forum"
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
            !kategorieFilter
              ? "bg-indigo-600 text-white"
              : "border border-slate-200 bg-surface text-slate-600 hover:border-indigo-300"
          }`}
        >
          Alle
        </Link>
        {FORUM_KATEGORIEN.map((k) => (
          <Link
            key={k}
            href={`/forum?kategorie=${k}`}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              kategorieFilter === k
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-surface text-slate-600 hover:border-indigo-300"
            }`}
          >
            {FORUM_KATEGORIE_LABEL[k]}
          </Link>
        ))}
      </div>

      {themen.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-indigo-200 bg-surface p-12 text-center shadow-card-forum">
          <MessagesSquare className="mx-auto mb-3 text-indigo-300" size={32} strokeWidth={1.5} />
          <p className="text-slate-600">
            {kategorieFilter
              ? "Noch keine Themen in dieser Kategorie."
              : "Noch keine Themen - eröffne das erste!"}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {themen.map((t) => (
            <li key={t.id}>
              <Link
                href={`/forum/${t.id}`}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-card-forum-hover sm:p-5"
              >
                <AvatarKreis
                  anzeige={avatarAnzeige(t.user.avatarKuerzel, t.user.username)}
                  farbe={t.user.avatarFarbe}
                  textFarbe={t.user.avatarTextFarbe}
                  status={t.user.status as NutzerStatus}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-base font-semibold text-slate-800 group-hover:text-indigo-700">
                    {t.titel}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{FORUM_KATEGORIE_LABEL[t.kategorie as ForumKategorie] ?? t.kategorie}</span>
                    <span>
                      von <span dir="auto">{communityAutorLabel(t.user)}</span>
                    </span>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
                  <Users size={13} /> {t._count.antworten}{" "}
                  {t._count.antworten === 1 ? "Antwort" : "Antworten"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
