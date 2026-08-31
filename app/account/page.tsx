import { redirect } from "next/navigation";
import { UserCircle, KeyRound, Mail, MailCheck, AlertTriangle } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import SectionCard from "@/components/SectionCard";
import UsernameForm from "@/components/UsernameForm";
import PasswordForm from "@/components/PasswordForm";
import EmailForm from "@/components/EmailForm";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { emailAenderung?: string };
}) {
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

      {searchParams.emailAenderung === "erfolgreich" && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-sm text-brand-800">
          <MailCheck size={16} className="shrink-0" />
          Neue E-Mail-Adresse bestätigt - du meldest dich ab jetzt damit an.
        </div>
      )}
      {searchParams.emailAenderung === "vergeben" && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0" />
          Diese E-Mail-Adresse wurde inzwischen von einem anderen Konto vergeben - deine
          E-Mail-Adresse wurde nicht geändert.
        </div>
      )}

      <div className="space-y-5">
        <SectionCard icon={UserCircle} title="Benutzername" subtitle="Schnellerer Login als mit der vollen E-Mail-Adresse">
          <UsernameForm initialUsername={user.username} />
        </SectionCard>

        <SectionCard icon={Mail} title="E-Mail-Adresse" subtitle="Wird für Login und Benachrichtigungen verwendet">
          <EmailForm aktuelleEmail={user.email} />
        </SectionCard>

        <SectionCard icon={KeyRound} title="Passwort" subtitle="Regelmäßig ändern erhöht die Sicherheit deines Kontos">
          <PasswordForm />
        </SectionCard>
      </div>
    </main>
  );
}
