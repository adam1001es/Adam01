import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import ForumChat from "@/components/ForumChat";

export const dynamic = "force-dynamic";

const CHAT_INITIAL_LIMIT = 50;

/** Live-Chat des Forums - lädt die letzten CHAT_INITIAL_LIMIT Nachrichten serverseitig, das
 * Polling danach übernimmt components/ForumChat.tsx (siehe app/api/forum/chat/route.ts). */
export default async function ForumChatPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!istZahlendesKonto(user)) redirect("/forum");

  const letzteNachrichten = await prisma.forumChatNachricht.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: CHAT_INITIAL_LIMIT,
    include: { user: { select: { username: true, avatarFarbe: true, avatarTextFarbe: true } } },
  });

  return (
    <main className="mx-auto max-w-2xl">
      <Link
        href="/forum"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-700"
      >
        <ArrowLeft size={15} /> Zurück zum Forum
      </Link>
      <h1 className="mb-4 flex items-center gap-2.5 font-display text-2xl font-semibold text-slate-800">
        <MessageCircle size={22} strokeWidth={2} /> Chat
      </h1>
      <ForumChat
        initialMessages={letzteNachrichten.reverse()}
        forumGesperrt={user.forumGesperrt}
      />
    </main>
  );
}
