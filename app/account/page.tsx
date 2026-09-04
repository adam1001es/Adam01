import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  KeyRound,
  Mail,
  MailCheck,
  AlertTriangle,
  Smile,
  UserCircle,
  GraduationCap,
  BarChart3,
  Gauge,
  FileText,
  Users,
  School,
  Cpu,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getKontingent, istZahlendesKonto, tierLabel, aktuellerZyklusStart } from "@/lib/quota";
import { summeTokensFuerUser } from "@/lib/usageLog";
import { prisma } from "@/lib/prisma";
import { SCHULSTUFEN_CLUSTER } from "@/lib/curriculum";
import { avatarAnzeige } from "@/lib/profil";
import SectionCard from "@/components/SectionCard";
import EinklappbareSectionCard from "@/components/EinklappbareSectionCard";
import UsernameForm from "@/components/UsernameForm";
import PasswordForm from "@/components/PasswordForm";
import EmailForm from "@/components/EmailForm";
import AvatarForm from "@/components/AvatarForm";
import UnterrichtsprofilForm from "@/components/UnterrichtsprofilForm";
import KontingentBanner from "@/components/KontingentBanner";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { emailAenderung?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const zahlend = istZahlendesKonto(user);
  // Gleiche Zeitraum-Logik wie getKontingent (siehe lib/quota.ts, "lebenslangZaehlen"): bei
  // aktivem Abo/Admin nur der laufende Zyklus, bei Gratis-Konten die gesamte Kontolebenszeit -
  // sonst würde die Token-Übersicht einen anderen Zeitraum zeigen als das Punkte-Guthaben direkt
  // darunter.
  const tokenZeitraumSeit = zahlend ? aktuellerZyklusStart(user.createdAt) : undefined;
  const [kontingent, tokenSumme, worksheetStats, klassenAnzahl, schuelerAnzahl] = await Promise.all([
    getKontingent(user),
    summeTokensFuerUser(user.id, tokenZeitraumSeit),
    prisma.worksheet.groupBy({
      by: ["geteilt"],
      where: { userId: user.id },
      _count: { _all: true },
    }),
    zahlend ? prisma.klasse.count({ where: { userId: user.id } }) : Promise.resolve(0),
    zahlend
      ? prisma.schueler.count({ where: { klasse: { userId: user.id } } })
      : Promise.resolve(0),
  ]);

  const arbeitsblaetterGesamt = worksheetStats.reduce((sum, g) => sum + g._count._all, 0);
  const arbeitsblaetterGeteilt =
    worksheetStats.find((g) => g.geteilt)?._count._all ?? 0;

  const mitgliedSeit = user.createdAt.toLocaleDateString("de-AT", {
    month: "long",
    year: "numeric",
  });

  const unterrichtsStufenLabels = user.unterrichtsStufen
    .map((id) => SCHULSTUFEN_CLUSTER.find((c) => c.id === id)?.label)
    .filter((l): l is string => Boolean(l));

  return (
    <main className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-black/10 text-lg font-bold shadow-card ring-2 ring-white"
          style={{ backgroundColor: user.avatarFarbe, color: user.avatarTextFarbe }}
          dir="auto"
        >
          {avatarAnzeige(user.avatarKuerzel, user.username)}
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800" dir="auto">
            {user.username ?? "Profil"}
          </h1>
          <p className="text-sm text-slate-500">
            {user.email} · Mitglied seit {mitgliedSeit}
          </p>
          {unterrichtsStufenLabels.length > 0 && (
            <p className="mt-1 flex flex-wrap gap-1.5">
              {unterrichtsStufenLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-medium text-gold-700"
                >
                  {label}
                </span>
              ))}
            </p>
          )}
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
        <EinklappbareSectionCard
          icon={<Smile size={18} strokeWidth={2} />}
          title="Profilbild"
          subtitle="Farbe deines Kürzels, mit dem man dich in der App wiedererkennt"
          autoCollapseAfterSave
        >
          <AvatarForm
            username={user.username}
            initialFarbe={user.avatarFarbe}
            initialTextFarbe={user.avatarTextFarbe}
            initialKuerzel={user.avatarKuerzel}
          />
        </EinklappbareSectionCard>

        <EinklappbareSectionCard
          icon={<GraduationCap size={18} strokeWidth={2} />}
          title="Unterrichtsprofil"
          subtitle="Welche Schulstufen unterrichtest du? Freiwillig, hilft später beim Austausch mit anderen Lehrkräften"
          akzent="gold"
          autoCollapseAfterSave
        >
          <UnterrichtsprofilForm initialStufen={user.unterrichtsStufen} />
        </EinklappbareSectionCard>

        <EinklappbareSectionCard icon={<BarChart3 size={18} strokeWidth={2} />} title="Deine Statistik" subtitle="Auf einen Blick">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatKachel icon={FileText} wert={arbeitsblaetterGesamt} label="Arbeitsblätter" />
            <StatKachel icon={Users} wert={arbeitsblaetterGeteilt} label="Geteilt" />
            {zahlend && <StatKachel icon={School} wert={klassenAnzahl} label="Klassen" />}
            {zahlend && (
              <StatKachel icon={GraduationCap} wert={schuelerAnzahl} label="Schüler:innen" />
            )}
          </div>
        </EinklappbareSectionCard>

        <SectionCard
          icon={Gauge}
          title="Kontingent"
          subtitle={tierLabel(kontingent.tier)}
        >
          <KontingentBanner kontingent={kontingent} />
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Cpu size={13} className="shrink-0" />
            {tokenSumme.gesamt.toLocaleString("de-AT")} Tokens ·{" "}
            {tokenSumme.anzahlAufrufe} {tokenSumme.anzahlAufrufe === 1 ? "Generierung" : "Generierungen"}{" "}
            {zahlend ? "in diesem Zyklus" : "insgesamt"}
          </p>
        </SectionCard>

        <SectionCard title="Benutzername" subtitle="Schnellerer Login als mit der vollen E-Mail-Adresse" icon={UserCircle}>
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

function StatKachel({
  icon: Icon,
  wert,
  label,
}: {
  icon: LucideIcon;
  wert: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-canvas p-3 text-center">
      <Icon size={16} strokeWidth={2} className="mx-auto text-brand-600" />
      <p className="mt-1 font-display text-xl font-semibold text-slate-800">{wert}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
