import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { istZahlendesKonto } from "@/lib/quota";
import { FORUM_GESPERRT_FEHLERTEXT } from "@/lib/forum";
import ForumNeuesThemaForm from "@/components/ForumNeuesThemaForm";

export const dynamic = "force-dynamic";

export default async function ForumNeuesThemaPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!istZahlendesKonto(user)) redirect("/forum");

  return (
    <main className="mx-auto max-w-2xl">
      <Link
        href="/forum"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-700"
      >
        <ArrowLeft size={15} /> Zurück zum Forum
      </Link>
      <h1 className="mb-4 font-display text-2xl font-semibold text-slate-800">Neues Thema</h1>
      {user.forumGesperrt ? (
        <p className="rounded-xl border border-slate-200 bg-surface p-6 text-center text-sm text-slate-500">
          {FORUM_GESPERRT_FEHLERTEXT}
        </p>
      ) : (
        <ForumNeuesThemaForm />
      )}
    </main>
  );
}
