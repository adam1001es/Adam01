import { redirect } from "next/navigation";
import { UserCircle } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import SectionCard from "@/components/SectionCard";
import UsernameForm from "@/components/UsernameForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <UserCircle size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Mein Konto</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <SectionCard icon={UserCircle} title="Benutzername" subtitle="Schnellerer Login als mit der vollen E-Mail-Adresse">
        <UsernameForm initialUsername={user.username} />
      </SectionCard>
    </main>
  );
}
