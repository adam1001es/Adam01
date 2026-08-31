import { redirect } from "next/navigation";
import { ShieldCheck, Users, CreditCard, TrendingUp, Coins, Scale } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  getKontingent,
  istTierAktiv,
  TIER_PREIS_EUR,
  GESCHAETZTE_KOSTEN_TEXT_PRO_BLATT_EUR,
  GESCHAETZTE_KOSTEN_PRO_BILD_EUR,
  zaehleGenerierteBilder,
} from "@/lib/quota";
import AdminUserTable, { AdminUserRow } from "@/components/AdminUserTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getSessionUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  const rows: AdminUserRow[] = await Promise.all(
    users.map(async (u) => {
      const [kontingent, gesamtErstellt] = await Promise.all([
        getKontingent(u),
        prisma.worksheet.count({ where: { userId: u.id } }),
      ]);
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        tier: u.tier,
        tierGueltigVon: u.tierGueltigVon,
        tierGueltigBis: u.tierGueltigBis,
        createdAt: u.createdAt,
        verbraucht: kontingent.verbraucht,
        limit: kontingent.unbegrenzt ? null : kontingent.limit,
        gesamtErstellt,
        istSelbst: u.id === admin.id,
      };
    }),
  );

  const istAktuellAktiv = (r: AdminUserRow) =>
    istTierAktiv(r.tier, r.tierGueltigVon, r.tierGueltigBis);
  const aktiveStarter = rows.filter((r) => r.tier === "starter" && istAktuellAktiv(r)).length;
  const aktivePro = rows.filter((r) => r.tier === "pro" && istAktuellAktiv(r)).length;
  const monatsumsatz = aktiveStarter * TIER_PREIS_EUR.starter + aktivePro * TIER_PREIS_EUR.pro;

  // Geschätzte KI-Kosten seit Monatsbeginn (Kalendermonat, nicht der individuelle 30-Tage-
  // Abo-Zyklus pro Konto - für eine grobe monatliche Kostenübersicht ausreichend genau). Bilder
  // werden pro Arbeitsblatt anhand des gespeicherten Inhalts EXAKT gezählt (siehe
  // zaehleGenerierteBilder), die Textkosten (Claude) sind eine grobe Pauschale pro Blatt, da
  // echte Token-Nutzung nicht pro Anfrage geloggt wird (siehe lib/quota.ts).
  const monatsbeginn = new Date();
  monatsbeginn.setDate(1);
  monatsbeginn.setHours(0, 0, 0, 0);
  const worksheetsDiesenMonat = await prisma.worksheet.findMany({
    where: { createdAt: { gte: monatsbeginn } },
    select: { contentJson: true },
  });
  const bilderDiesenMonat = worksheetsDiesenMonat.reduce(
    (summe, w) => summe + zaehleGenerierteBilder(w.contentJson),
    0,
  );
  const geschaetzteKosten =
    worksheetsDiesenMonat.length * GESCHAETZTE_KOSTEN_TEXT_PRO_BLATT_EUR +
    bilderDiesenMonat * GESCHAETZTE_KOSTEN_PRO_BILD_EUR;
  const geschaetzterGewinn = monatsumsatz - geschaetzteKosten;

  const STATS = [
    { icon: Users, label: "Konten gesamt", wert: String(rows.length) },
    { icon: CreditCard, label: "Aktive Abos", wert: `${aktiveStarter + aktivePro} (${aktiveStarter} Starter · ${aktivePro} Pro)` },
    { icon: TrendingUp, label: "Geschätzter Monatsumsatz", wert: `${monatsumsatz.toFixed(2)}€` },
    {
      icon: Coins,
      label: "Geschätzte KI-Kosten (Monat)",
      wert: `${geschaetzteKosten.toFixed(2)}€`,
      unterschrift: `${worksheetsDiesenMonat.length} Arbeitsblätter · ${bilderDiesenMonat} Bilder`,
    },
    {
      icon: Scale,
      label: "Geschätzter Gewinn/Verlust (Monat)",
      wert: `${geschaetzterGewinn >= 0 ? "+" : ""}${geschaetzterGewinn.toFixed(2)}€`,
      farbe: geschaetzterGewinn >= 0 ? "text-brand-700" : "text-red-600",
    },
  ];

  return (
    <main>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <ShieldCheck size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Konten verwalten</h1>
          <p className="text-sm text-slate-500">
            Kontingent nach privat organisierter Bezahlung zuweisen, Konten suchen und entfernen.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map(({ icon: Icon, label, wert, unterschrift, farbe }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Icon size={14} />
              {label}
            </div>
            <div className={`mt-1.5 font-display text-2xl font-semibold ${farbe ?? "text-slate-800"}`}>
              {wert}
            </div>
            {unterschrift && <div className="mt-1 text-xs text-slate-400">{unterschrift}</div>}
          </div>
        ))}
      </div>

      <AdminUserTable rows={rows} />
    </main>
  );
}
