"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Trash2, RefreshCw, Plus, Loader2, BookOpenText, Link2 } from "lucide-react";
import { THEMENBEREICHE, THEMENBEREICH_KEYS, SCHULSTUFEN_CLUSTER } from "@/lib/curriculum";
import { WISSENS_STATUS_LABEL } from "@/lib/wissensbasis";
import type { AufgabentypAnalyseZeile } from "@/lib/wissensbasis";
import { inputClass, labelClass } from "@/lib/formStyles";
import { formatiereKoranZitat, type QuranVers } from "@/lib/quranApi";

export interface WissensEintragRow {
  id: string;
  typ: "zitat" | "musteraufgabe";
  themenbereich: string;
  schulstufeCluster: string | null;
  inhalt: unknown;
  rechercheNotiz: string | null;
  quellWorksheetIds: string[];
  status: "entwurf" | "geprueft" | "abgelehnt";
  createdAt: string;
  geprueftAm: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  entwurf: "border-amber-200 bg-amber-50 text-amber-700",
  geprueft: "border-brand-200 bg-brand-50 text-brand-700",
  abgelehnt: "border-slate-200 bg-slate-100 text-slate-500",
};

type Tab = "zitat" | "musteraufgabe" | "analyse";

/** Interaktiver Teil der Admin-only Wissensbasis (siehe app/admin/wissensbasis/page.tsx für die
 * serverseitige Datenladung, lib/wissensbasis.ts für das Gesamtkonzept). Drei Tabs: Zitate,
 * Musteraufgaben (beide mit demselben Freigabe-Workflow), Aufgabentyp-Analyse (rein lesend). */
export default function WissensbasisClient({
  eintraege,
  analyse,
}: {
  eintraege: WissensEintragRow[];
  analyse: AufgabentypAnalyseZeile[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("zitat");
  const [scanLaeuft, setScanLaeuft] = useState(false);
  const [scanErgebnis, setScanErgebnis] = useState<string | null>(null);
  const [formOffen, setFormOffen] = useState(false);
  const [koranOffen, setKoranOffen] = useState(false);
  const [linkOffen, setLinkOffen] = useState(false);

  const gefiltert = eintraege.filter((e) => e.typ === tab);
  const entwuerfeAnzahl = (typ: Tab) =>
    typ === "analyse" ? 0 : eintraege.filter((e) => e.typ === typ && e.status === "entwurf").length;

  async function scanStarten() {
    setScanLaeuft(true);
    setScanErgebnis(null);
    try {
      const res = await fetch("/api/admin/wissensbasis/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan fehlgeschlagen.");
      setScanErgebnis(
        `${data.neueEntwuerfe} neue Entwürfe (${data.uebersprungeneDuplikate} übersprungen, ${data.durchsuchteArbeitsblaetter} Arbeitsblätter durchsucht).`,
      );
      router.refresh();
    } catch (err) {
      setScanErgebnis(err instanceof Error ? err.message : "Scan fehlgeschlagen.");
    } finally {
      setScanLaeuft(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200">
        {(["zitat", "musteraufgabe", "analyse"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setFormOffen(false);
            }}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "zitat" ? "Zitate" : t === "musteraufgabe" ? "Musteraufgaben" : "Aufgabentyp-Analyse"}
            {entwuerfeAnzahl(t) > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                {entwuerfeAnzahl(t)}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "analyse" ? (
        <AnalyseTabelle analyse={analyse} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {tab === "zitat" && (
              <button
                type="button"
                onClick={scanStarten}
                disabled={scanLaeuft}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-60"
              >
                {scanLaeuft ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                Arbeitsblätter durchsuchen
              </button>
            )}
            {tab === "zitat" && (
              <button
                type="button"
                onClick={() => setKoranOffen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gold-300 bg-gold-50 px-3.5 py-2 text-sm font-medium text-gold-700 shadow-sm transition hover:bg-gold-100"
              >
                <BookOpenText size={15} /> Aus dem Koran nachschlagen
              </button>
            )}
            {tab === "zitat" && (
              <button
                type="button"
                onClick={() => setLinkOffen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gold-300 bg-gold-50 px-3.5 py-2 text-sm font-medium text-gold-700 shadow-sm transition hover:bg-gold-100"
              >
                <Link2 size={15} /> Hadith/Tafsir von Link importieren
              </button>
            )}
            <button
              type="button"
              onClick={() => setFormOffen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
            >
              <Plus size={15} /> Eintrag anlegen
            </button>
            {scanErgebnis && <span className="text-xs text-slate-500">{scanErgebnis}</span>}
          </div>

          {koranOffen && tab === "zitat" && (
            <KoranNachschlagen
              onDone={() => {
                setKoranOffen(false);
                router.refresh();
              }}
            />
          )}

          {linkOffen && tab === "zitat" && (
            <LinkImportieren
              onDone={() => {
                setLinkOffen(false);
                router.refresh();
              }}
            />
          )}

          {formOffen && (
            <NeuerEintragForm
              typ={tab}
              onDone={() => {
                setFormOffen(false);
                router.refresh();
              }}
            />
          )}

          {gefiltert.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-surface p-6 text-center text-sm text-slate-500">
              Noch keine Einträge.
            </p>
          ) : (
            <div className="space-y-3">
              {gefiltert.map((e) => (
                <EintragCard key={e.id} eintrag={e} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EintragCard({ eintrag }: { eintrag: WissensEintragRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [inhaltText, setInhaltText] = useState(JSON.stringify(eintrag.inhalt, null, 2));
  const [notizText, setNotizText] = useState(eintrag.rechercheNotiz ?? "");
  const [fehler, setFehler] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setFehler(null);
    try {
      const res = await fetch(`/api/admin/wissensbasis/${eintrag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehlgeschlagen.");
      router.refresh();
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function speichern() {
    let inhalt: unknown;
    try {
      inhalt = JSON.parse(inhaltText);
    } catch {
      setFehler("Inhalt ist kein gültiges JSON.");
      return;
    }
    await patch({ inhalt, rechercheNotiz: notizText });
    setBearbeiten(false);
  }

  async function loeschen() {
    if (!confirm("Diesen Eintrag wirklich endgültig löschen?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/wissensbasis/${eintrag.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setFehler("Löschen fehlgeschlagen.");
      setBusy(false);
    }
  }

  const themenbereichLabel =
    THEMENBEREICHE[eintrag.themenbereich as keyof typeof THEMENBEREICHE]?.label ?? eintrag.themenbereich;

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        eintrag.status === "entwurf" ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[eintrag.status]}`}
          >
            {WISSENS_STATUS_LABEL[eintrag.status]}
          </span>
          <span className="text-xs text-slate-400">{themenbereichLabel}</span>
          {eintrag.schulstufeCluster && (
            <span className="text-xs text-slate-400">
              ·{" "}
              {SCHULSTUFEN_CLUSTER.find((c) => c.id === eintrag.schulstufeCluster)?.label ??
                eintrag.schulstufeCluster}
            </span>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {eintrag.status !== "geprueft" && (
            <button
              type="button"
              onClick={() => patch({ status: "geprueft" })}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-60"
            >
              <CheckCircle2 size={13} /> Freigeben
            </button>
          )}
          {eintrag.status !== "abgelehnt" && (
            <button
              type="button"
              onClick={() => patch({ status: "abgelehnt" })}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-60"
            >
              <XCircle size={13} /> Ablehnen
            </button>
          )}
          <button
            type="button"
            onClick={() => setBearbeiten((v) => !v)}
            className="text-xs font-medium text-slate-500 hover:text-brand-700"
          >
            Bearbeiten
          </button>
          <button
            type="button"
            onClick={loeschen}
            disabled={busy}
            className="text-slate-400 hover:text-red-600 disabled:opacity-60"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {!bearbeiten ? (
        <>
          <InhaltAnzeige typ={eintrag.typ} inhalt={eintrag.inhalt} />
          {eintrag.rechercheNotiz && (
            <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-600">
              <span className="font-medium text-slate-500">Recherche-Notiz: </span>
              {eintrag.rechercheNotiz}
            </p>
          )}
          {eintrag.quellWorksheetIds.length > 0 && (
            <p className="mt-1.5 text-xs text-slate-400">
              Quelle: {eintrag.quellWorksheetIds.length} Arbeitsblätter
            </p>
          )}
        </>
      ) : (
        <div className="mt-3 space-y-2">
          <textarea
            className={`${inputClass} font-mono text-xs`}
            rows={6}
            value={inhaltText}
            onChange={(e) => setInhaltText(e.target.value)}
          />
          <textarea
            className={inputClass}
            rows={2}
            placeholder="Recherche-Notiz"
            value={notizText}
            onChange={(e) => setNotizText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={speichern}
              disabled={busy}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setBearbeiten(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
      {fehler && <p className="mt-2 text-xs text-red-600">{fehler}</p>}
    </div>
  );
}

function InhaltAnzeige({ typ, inhalt }: { typ: "zitat" | "musteraufgabe"; inhalt: unknown }) {
  if (typ === "zitat") {
    const z = inhalt as { bezeichnung?: string; text?: string; kontext?: string };
    return (
      <div className="mt-2">
        <p className="text-sm font-medium text-slate-800">{z.bezeichnung}</p>
        {z.text && <p className="mt-0.5 text-sm text-slate-600">{z.text}</p>}
        {z.kontext && <p className="mt-0.5 text-xs italic text-slate-500">{z.kontext}</p>}
      </div>
    );
  }
  const a = inhalt as { frage?: string; typ?: string };
  return (
    <div className="mt-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{a.typ}</p>
      <p className="text-sm text-slate-800">{a.frage}</p>
    </div>
  );
}

function AnalyseTabelle({ analyse }: { analyse: AufgabentypAnalyseZeile[] }) {
  if (analyse.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-surface p-6 text-center text-sm text-slate-500">
        Noch keine Daten.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-2.5">Aufgabentyp</th>
            <th className="px-4 py-2.5">Arbeitsblätter</th>
            <th className="px-4 py-2.5">Aufgaben gesamt</th>
            <th className="px-4 py-2.5">davon gemeldet</th>
            <th className="px-4 py-2.5">davon geteilt</th>
          </tr>
        </thead>
        <tbody>
          {analyse.map((z) => (
            <tr key={z.typ} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-2.5 font-medium text-slate-700">{z.typ}</td>
              <td className="px-4 py-2.5">{z.anzahlArbeitsblaetter}</td>
              <td className="px-4 py-2.5">{z.anzahlVorkommen}</td>
              <td className="px-4 py-2.5">
                {z.anzahlGemeldet}
                {z.anzahlArbeitsblaetter > 0 && (
                  <span className="ml-1 text-xs text-slate-400">
                    ({Math.round((z.anzahlGemeldet / z.anzahlArbeitsblaetter) * 100)}%)
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5">{z.anzahlGeteilt}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-2.5 text-xs text-slate-400">
        „davon gemeldet" bezieht sich auf das ganze Arbeitsblatt, nicht zwingend auf diese konkrete
        Aufgabe - grobes Signal, keine exakte Fehlerquote.
      </p>
    </div>
  );
}

/** Live-Nachschlagewerkzeug statt Korantext selbst zu speichern/aus dem Gedächtnis
 * abzuschreiben (siehe lib/quranApi.ts) - holt Arabisch + deutsche Übersetzung (Bubenheim &
 * Elyas) direkt von der Al-Quran-Cloud-API. Der Admin wählt gezielt aus, was als Entwurf in die
 * Wissensbasis übernommen wird - kein Massen-Import des ganzen Korans auf einmal. */
function KoranNachschlagen({ onDone }: { onDone: () => void }) {
  const [sure, setSure] = useState("2");
  const [von, setVon] = useState("255");
  const [bis, setBis] = useState("255");
  const [themenbereich, setThemenbereich] = useState<string>(THEMENBEREICH_KEYS[0]);
  const [suchLaeuft, setSuchLaeuft] = useState(false);
  const [uebernehmenLaeuft, setUebernehmenLaeuft] = useState(false);
  const [ergebnis, setErgebnis] = useState<QuranVers[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function suchen() {
    setSuchLaeuft(true);
    setFehler(null);
    setErgebnis(null);
    try {
      const params = new URLSearchParams({ sure, von, bis: bis || von });
      const res = await fetch(`/api/admin/wissensbasis/koran-nachschlagen?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nachschlagen fehlgeschlagen.");
      setErgebnis(data.verse);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Nachschlagen fehlgeschlagen.");
    } finally {
      setSuchLaeuft(false);
    }
  }

  async function uebernehmen() {
    if (!ergebnis || ergebnis.length === 0) return;
    setUebernehmenLaeuft(true);
    setFehler(null);
    const { bezeichnung, text } = formatiereKoranZitat(ergebnis);
    try {
      const res = await fetch("/api/admin/wissensbasis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typ: "zitat",
          themenbereich,
          inhalt: { bezeichnung, text },
          rechercheNotiz:
            "Text direkt per Al-Quran-Cloud-API (Edition de.bubenheim - Bubenheim & Elyas) abgerufen, keine manuelle Abschrift - bitte trotzdem inhaltlich/thematisch gegenchecken, bevor freigegeben wird.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Anlegen fehlgeschlagen.");
      setErgebnis(null);
      onDone();
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Anlegen fehlgeschlagen.");
    } finally {
      setUebernehmenLaeuft(false);
    }
  }

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-gold-200 bg-gold-50/40 p-4">
      <p className="text-xs leading-relaxed text-gold-700">
        Ruft den Vers live über die Al-Quran-Cloud-API ab (Arabisch + deutsche Übersetzung von
        Bubenheim &amp; Elyas) - kein Abschreiben aus dem Gedächtnis, der Text ist damit
        garantiert korrekt zitiert. Es wird nichts automatisch gespeichert, nur was du unten
        explizit übernimmst.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className={labelClass}>Sure (1-114)</span>
          <input className={`${inputClass} w-20`} value={sure} onChange={(e) => setSure(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>Vers von</span>
          <input className={`${inputClass} w-20`} value={von} onChange={(e) => setVon(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>bis (optional)</span>
          <input className={`${inputClass} w-20`} value={bis} onChange={(e) => setBis(e.target.value)} />
        </label>
        <button
          type="button"
          onClick={suchen}
          disabled={suchLaeuft}
          className="rounded-lg bg-gold-600 px-4 py-2 text-sm font-medium text-white hover:bg-gold-700 disabled:opacity-60"
        >
          {suchLaeuft ? "Suche..." : "Nachschlagen"}
        </button>
      </div>

      {fehler && <p className="text-xs text-red-600">{fehler}</p>}

      {ergebnis && (
        <div className="space-y-3 rounded-lg bg-white/70 p-3">
          <div className="space-y-2">
            {ergebnis.map((v) => (
              <div key={v.versNummer}>
                <p dir="rtl" className="text-right text-lg leading-relaxed text-slate-800">
                  {v.arabisch}
                </p>
                <p className="text-sm text-slate-700">
                  {v.versNummer}. {v.deutsch}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3">
            <label className="block">
              <span className={labelClass}>Grundkompetenz</span>
              <select
                className={inputClass}
                value={themenbereich}
                onChange={(e) => setThemenbereich(e.target.value)}
              >
                {THEMENBEREICH_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {THEMENBEREICHE[k].label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={uebernehmen}
              disabled={uebernehmenLaeuft}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Als Entwurf übernehmen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Gegenstück zu KoranNachschlagen für Hadith/Tafsir, für die es (recherchiert, siehe
 * lib/linkImport.ts) keine geprüfte deutsche Live-API gibt: der Admin gibt eine URL zu einer ihm
 * bekannten, vertrauenswürdigen Quelle an, wir übernehmen nur das mechanische Abschreiben
 * (Zitat + Quellenangabe extrahieren). Im Unterschied zum Koran-Tool ist das Ergebnis NICHT
 * automatisch verlässlich - Bezeichnung/Text sind deshalb bewusst editierbar, und die
 * Verantwortung für die Quellenauswahl bleibt beim Admin. */
function LinkImportieren({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [bezeichnung, setBezeichnung] = useState("");
  const [text, setText] = useState("");
  const [hinweis, setHinweis] = useState("");
  const [themenbereich, setThemenbereich] = useState<string>(THEMENBEREICH_KEYS[0]);
  const [importLaeuft, setImportLaeuft] = useState(false);
  const [uebernehmenLaeuft, setUebernehmenLaeuft] = useState(false);
  const [ergebnisDa, setErgebnisDa] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function importieren() {
    setImportLaeuft(true);
    setFehler(null);
    setErgebnisDa(false);
    try {
      const res = await fetch("/api/admin/wissensbasis/link-importieren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import fehlgeschlagen.");
      setBezeichnung(data.bezeichnung);
      setText(data.text);
      setHinweis(data.hinweis ?? "");
      setErgebnisDa(true);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Import fehlgeschlagen.");
    } finally {
      setImportLaeuft(false);
    }
  }

  async function uebernehmen() {
    setUebernehmenLaeuft(true);
    setFehler(null);
    try {
      const res = await fetch("/api/admin/wissensbasis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typ: "zitat",
          themenbereich,
          inhalt: { bezeichnung, text },
          rechercheNotiz: `Automatisch von ${url} extrahiert - KEINE geprüfte API-Quelle wie beim Koran-Tool, die Verlässlichkeit hängt vollständig von dieser Webseite ab. Vor Freigabe inhaltlich UND anhand einer Referenz-Ausgabe gegenchecken.${hinweis ? ` Hinweis von der Seite selbst: ${hinweis}` : ""}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Anlegen fehlgeschlagen.");
      setErgebnisDa(false);
      setUrl("");
      onDone();
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Anlegen fehlgeschlagen.");
    } finally {
      setUebernehmenLaeuft(false);
    }
  }

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-gold-200 bg-gold-50/40 p-4">
      <p className="text-xs leading-relaxed text-gold-700">
        Für Hadith/Tafsir gibt es (anders als beim Koran) keine geprüfte deutsche Live-API - gib
        stattdessen den Link zu einer dir bekannten, vertrauenswürdigen Seite an. Übernimmt nur
        das mechanische Abschreiben (Zitat + Quellenangabe), NICHT die inhaltliche Prüfung - das
        Ergebnis ist editierbar und muss vor Freigabe wie jeder andere Entwurf gegengecheckt werden.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="block min-w-[280px] flex-1">
          <span className={labelClass}>Link zur Quelle</span>
          <input
            className={inputClass}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>
        <button
          type="button"
          onClick={importieren}
          disabled={importLaeuft || !url.trim()}
          className="rounded-lg bg-gold-600 px-4 py-2 text-sm font-medium text-white hover:bg-gold-700 disabled:opacity-60"
        >
          {importLaeuft ? "Importiere..." : "Importieren"}
        </button>
      </div>

      {fehler && <p className="text-xs text-red-600">{fehler}</p>}

      {ergebnisDa && (
        <div className="space-y-3 rounded-lg bg-white/70 p-3">
          <label className="block">
            <span className={labelClass}>Quellenangabe</span>
            <input className={inputClass} value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Zitat-Text</span>
            <textarea
              className={inputClass}
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          {hinweis && (
            <p className="text-xs leading-relaxed text-slate-500">
              Hinweis von der Seite selbst: {hinweis}
            </p>
          )}
          <div className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3">
            <label className="block">
              <span className={labelClass}>Grundkompetenz</span>
              <select
                className={inputClass}
                value={themenbereich}
                onChange={(e) => setThemenbereich(e.target.value)}
              >
                {THEMENBEREICH_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {THEMENBEREICHE[k].label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={uebernehmen}
              disabled={uebernehmenLaeuft || !bezeichnung.trim() || !text.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Als Entwurf übernehmen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NeuerEintragForm({
  typ,
  onDone,
}: {
  typ: "zitat" | "musteraufgabe";
  onDone: () => void;
}) {
  const [themenbereich, setThemenbereich] = useState<string>(THEMENBEREICH_KEYS[0]);
  const [schulstufeCluster, setSchulstufeCluster] = useState<string>("");
  const [bezeichnung, setBezeichnung] = useState("");
  const [text, setText] = useState("");
  const [kontext, setKontext] = useState("");
  const [inhaltJson, setInhaltJson] = useState(
    '{\n  "nr": 1,\n  "typ": "offene_frage",\n  "frage": "",\n  "anforderungsbereich": "afb1"\n}',
  );
  const [rechercheNotiz, setRechercheNotiz] = useState("");
  const [senden, setSenden] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function anlegen() {
    setSenden(true);
    setFehler(null);
    let inhalt: unknown;
    if (typ === "zitat") {
      inhalt = { bezeichnung, text: text || undefined, kontext: kontext || undefined };
    } else {
      try {
        inhalt = JSON.parse(inhaltJson);
      } catch {
        setFehler("Inhalt ist kein gültiges JSON.");
        setSenden(false);
        return;
      }
    }
    try {
      const res = await fetch("/api/admin/wissensbasis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typ,
          themenbereich,
          schulstufeCluster: schulstufeCluster || null,
          inhalt,
          rechercheNotiz: rechercheNotiz || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Anlegen fehlgeschlagen.");
      onDone();
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Anlegen fehlgeschlagen.");
    } finally {
      setSenden(false);
    }
  }

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Grundkompetenz</span>
          <select
            className={inputClass}
            value={themenbereich}
            onChange={(e) => setThemenbereich(e.target.value)}
          >
            {THEMENBEREICH_KEYS.map((k) => (
              <option key={k} value={k}>
                {THEMENBEREICHE[k].label}
              </option>
            ))}
          </select>
        </label>
        {typ === "musteraufgabe" && (
          <label className="block">
            <span className={labelClass}>Schulstufen-Cluster (optional)</span>
            <select
              className={inputClass}
              value={schulstufeCluster}
              onChange={(e) => setSchulstufeCluster(e.target.value)}
            >
              <option value="">Alle Schulstufen</option>
              {SCHULSTUFEN_CLUSTER.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {typ === "zitat" ? (
        <>
          <label className="block">
            <span className={labelClass}>Bezeichnung (z.B. „Sure 2, Vers 255")</span>
            <input className={inputClass} value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Text/Übersetzung (optional)</span>
            <textarea className={inputClass} rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Kontext/Einsatz (optional)</span>
            <textarea className={inputClass} rows={2} value={kontext} onChange={(e) => setKontext(e.target.value)} />
          </label>
        </>
      ) : (
        <label className="block">
          <span className={labelClass}>Aufgabe (JSON, siehe Aufgabe-Schema in lib/types.ts)</span>
          <textarea
            className={`${inputClass} font-mono text-xs`}
            rows={8}
            value={inhaltJson}
            onChange={(e) => setInhaltJson(e.target.value)}
          />
        </label>
      )}

      <label className="block">
        <span className={labelClass}>Recherche-Notiz (optional)</span>
        <textarea
          className={inputClass}
          rows={2}
          value={rechercheNotiz}
          onChange={(e) => setRechercheNotiz(e.target.value)}
        />
      </label>

      {fehler && <p className="text-xs text-red-600">{fehler}</p>}

      <button
        type="button"
        onClick={anlegen}
        disabled={senden}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        Als Entwurf anlegen
      </button>
    </div>
  );
}
