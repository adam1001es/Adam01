import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, CreditCard, TrendingUp, Coins, Scale, Cpu, Calculator } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  istTierAktiv,
  TIER_PREIS_EUR,
  GESCHAETZTE_KOSTEN_TEXT_PRO_BLATT_EUR,
  GESCHAETZTE_KOSTEN_PRO_BILD_EUR,
  zaehleGenerierteBilder,
  formatEur,
} from "@/lib/quota";
import { summeTokens, summeKostenEur, durchschnittKostenProBlattEur } from "@/lib/usageLog";
import { KOSTEN_BERECHNUNGSGRUNDLAGE } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/** Kosten-/Umsatz-Übersicht, ausgelagert aus der Konten-Verwaltung (siehe app/admin/page.tsx) -
 * eigener Bereich, damit die Startseite des Admin-Bereichs wieder das ist, was ihre Überschrift
 * schon immer sagte ("Konten verwalten"): Konten suchen/verwalten, ohne von einem großen
 * Zahlen-Grid davor verdeckt zu werden. */
export default async function AdminKostenPage() {
  const admin = await getSessionUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/");

  const users = await prisma.user.findMany({
    select: { tier: true, tierGueltigVon: true, tierGueltigBis: true },
  });

  // "starter" bleibt als Alias auf dasselbe (einzige) Abo bestehen - reine Abwärtskompatibilität
  // für Konten, die vor der Umstellung auf ein Ein-Tarif-Modell noch "starter" zugewiesen
  // bekamen (siehe lib/quota.ts) - daher hier zusammengezählt statt separat ausgewiesen.
  const aktiveAbos = users.filter(
    (u) => u.tier && istTierAktiv(u.tier, u.tierGueltigVon, u.tierGueltigBis),
  ).length;
  const monatsumsatz = aktiveAbos * TIER_PREIS_EUR.pro;

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

  // Echte Claude-Token-Nutzung UND daraus berechnete echte Kosten (siehe lib/usageLog.ts,
  // lib/pricing.ts) - im Unterschied zur Pauschalschätzung oben bleibt diese Zahl auch nach dem
  // Löschen einzelner Arbeitsblätter unverändert korrekt, da UsageLog unabhängig vom Worksheet
  // gespeichert wird. Erfasst erst Arbeitsblätter ab Einführung dieser Funktion - ältere haben
  // keine UsageLog-Zeilen. Der €-Betrag ist eine Schätzung auf Basis von Anthropic-Listenpreisen
  // und einem gerundeten Wechselkurs (siehe KOSTEN_BERECHNUNGSGRUNDLAGE), kein exakter
  // Rechnungsbetrag.
  const [tokensMonat, kostenMonat, kostenGesamt, durchschnittGesamt] = await Promise.all([
    summeTokens(monatsbeginn),
    summeKostenEur(monatsbeginn),
    summeKostenEur(),
    durchschnittKostenProBlattEur(),
  ]);

  const STATS = [
    { icon: Users, label: "Konten gesamt", wert: String(users.length) },
    { icon: CreditCard, label: "Aktive Abos", wert: String(aktiveAbos) },
    { icon: TrendingUp, label: "Geschätzter Monatsumsatz", wert: `${formatEur(monatsumsatz)}€` },
    {
      icon: Coins,
      label: "Geschätzte KI-Kosten (Monat)",
      wert: `${formatEur(geschaetzteKosten)}€`,
      unterschrift: `${worksheetsDiesenMonat.length} Arbeitsblätter · ${bilderDiesenMonat} Bilder`,
    },
    {
      icon: Scale,
      label: "Geschätzter Gewinn/Verlust (Monat)",
      wert: `${geschaetzterGewinn >= 0 ? "+" : ""}${formatEur(geschaetzterGewinn)}€`,
      farbe: geschaetzterGewinn >= 0 ? "text-brand-700" : "text-red-600",
    },
    {
      icon: Cpu,
      label: "Echte Kosten (Monat)",
      wert: kostenMonat < 0.01 && kostenMonat > 0 ? "<0,01€" : `${formatEur(kostenMonat)}€`,
      unterschrift: `${tokensMonat.gesamt.toLocaleString("de-AT")} Tokens · ${tokensMonat.anzahlAufrufe} API-Aufrufe`,
    },
    {
      icon: Cpu,
      label: "Echte Kosten (gesamt)",
      wert: kostenGesamt < 0.01 && kostenGesamt > 0 ? "<0,01€" : `${formatEur(kostenGesamt)}€`,
      unterschrift: "bleibt beim Löschen von Arbeitsblättern unverändert",
    },
    {
      icon: Calculator,
      label: "Ø Kosten pro Arbeitsblatt (echt)",
      wert:
        durchschnittGesamt.durchschnittEur === null
          ? "–"
          : `${formatEur(durchschnittGesamt.durchschnittEur)}€`,
      unterschrift:
        durchschnittGesamt.anzahlBlaetter === 0
          ? "noch keine Daten"
          : `Basis: ${durchschnittGesamt.anzahlBlaetter} Arbeitsblätter${durchschnittGesamt.anzahlBlaetter < 20 ? " - noch wenig Datenbasis" : ""}`,
      farbe: durchschnittGesamt.anzahlBlaetter > 0 && durchschnittGesamt.anzahlBlaetter < 20 ? "text-amber-600" : undefined,
    },
  ];

  return (
    <main>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft size={15} /> Zurück zur Konten-Verwaltung
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Coins size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Kosten &amp; Umsatz</h1>
          <p className="text-sm text-slate-500">
            Geschätzter Umsatz/Gewinn sowie echte Claude-Token-Nutzung und -Kosten.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map(({ icon: Icon, label, wert, unterschrift, farbe }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-card">
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
      <p className="text-xs text-slate-400">"Echte Kosten": {KOSTEN_BERECHNUNGSGRUNDLAGE}.</p>
    </main>
  );
}
