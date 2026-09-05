"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileEdit,
  ListChecks,
  BookMarked,
  Plus,
  Trash2,
  Save,
  Sparkles,
  PenLine,
  Quote,
  BookOpenText,
  RotateCcw,
  X,
  LayoutTemplate,
} from "lucide-react";
import {
  WorksheetContent,
  Aufgabe,
  Quelle,
  BildergeschichteSchritt,
  AUFGABEN_TYPEN_AKTIV,
  AUFGABEN_TYP_MAXIMUM,
  KOMPLEXITAET_STUFEN,
  KOMPLEXITAET_LABEL,
  Komplexitaet,
  LayoutConfig,
  TEMPLATES,
  FARBMODI,
  MUSTER_VARIANTEN,
} from "@/lib/types";
import { ANFORDERUNGSBEREICHE, ANFORDERUNGSBEREICHE_KEYS, AnforderungsbereichKey } from "@/lib/curriculum";
import { ICON_KEYS, ICONS, IconKey, iconPfadWeb, generiertesBildPfadWeb } from "@/lib/icons";
import { erzeugeWortsucheGitter } from "@/lib/wortsuche";
import { erzeugeKreuzwortraetsel } from "@/lib/kreuzwortraetsel";
import { MAX_VERSE_PRO_ABFRAGE, type SurahMeta } from "@/lib/quranApi";
import { MUSTER_LABEL } from "@/lib/patternStrip";
import { SEKTION_FARBEN } from "@/lib/sectionFarben";
import SectionCard from "@/components/SectionCard";
import ToggleSwitch from "@/components/ToggleSwitch";
import IslamicPatternStrip from "@/components/IslamicPatternStrip";
import { inputClass, labelClass } from "@/lib/formStyles";

const CHIP_BASIS = "border-slate-200 text-slate-500 hover:border-slate-300";
const TEMPLATE_META: Record<(typeof TEMPLATES)[number], { label: string; swatch: string }> = {
  klassisch: { label: "Klassisch", swatch: "#9c7a2c" },
  modern: { label: "Modern", swatch: "#0f766e" },
  kompakt: { label: "Kompakt", swatch: "#64748b" },
};

/** Ein geprüfter Hadith-Zitat-Eintrag aus der Wissensbasis (siehe app/api/hadithe/route.ts) -
 * eigener, schlanker Typ statt ZitatInhalt direkt zu importieren, damit dieses Formular nicht von
 * lib/wissensbasis.ts (Prisma-Zugriff) abhängen muss - analog zum selben Muster in
 * NewWorksheetForm.tsx. */
interface HadithListeneintrag {
  id: string;
  sammlung: string;
  bezeichnung: string;
  textVorschau?: string;
}

/** Methoden, um eine neue Aufgabe zu ergänzen (siehe "Aufgabe hinzufügen" unten) - bewusst NICHT
 * nur "per KI erstellen": eine Lehrkraft, die z.B. nur schon vorhandene Aufgaben umsortieren oder
 * händisch eine eigene Aufgabe eintippen möchte, soll das ohne KI-Aufruf tun können, und ein
 * bereits geprüfter Hadith/Koran-Vers aus der Wissensbasis bzw. der Koran-API lässt sich direkt
 * (ohne Claude-Aufruf, ohne Limit) als Lesetext-Aufgabe übernehmen. */
const ADD_METHODEN = [
  { key: "leer", label: "Leer", icon: PenLine },
  { key: "ki", label: "Von KI erstellen", icon: Sparkles },
  { key: "hadith", label: "Hadith", icon: Quote },
  { key: "koranvers", label: "Koran-Vers", icon: BookOpenText },
] as const;
type AddMethode = (typeof ADD_METHODEN)[number]["key"];

const TYP_LABEL: Record<Aufgabe["typ"], string> = {
  multiple_choice: "Multiple Choice",
  lueckentext: "Lückentext",
  zuordnung: "Zuordnung",
  offene_frage: "Offene Frage",
  wahr_falsch: "Wahr oder Falsch",
  ausmalbild: "Ausmalbild",
  bildergeschichte: "Bildergeschichte",
  reihenfolge: "Reihenfolge",
  lesetext: "Lesetext",
  diskussion: "Diskussionsimpuls",
  wortsuche: "Wortsuche",
  kreuzwortraetsel: "Kreuzworträtsel",
  malaufgabe: "Malaufgabe",
  recherche_auftrag: "Recherche-/Referat-Auftrag",
  bewegungsaufgabe: "Bewegungsaufgabe",
  sortierkarten: "Sortierkarten",
  nachspuruebung: "Nachspurübung",
};

function IconSelect({
  value,
  onChange,
}: {
  value: IconKey | undefined;
  onChange: (key: IconKey) => void;
}) {
  return (
    <select
      className={inputClass}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value as IconKey)}
    >
      <option value="" disabled>
        — Bild wählen —
      </option>
      {ICON_KEYS.map((key) => (
        <option key={key} value={key}>
          {ICONS[key].label}
        </option>
      ))}
    </select>
  );
}

function naechsteNr(aufgaben: Aufgabe[]): number {
  return aufgaben.reduce((max, a) => Math.max(max, a.nr), 0) + 1;
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
    >
      <Plus size={14} strokeWidth={2.5} />
      {children}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700"
    >
      <Trash2 size={13} /> Entfernen
    </button>
  );
}

export default function EditWorksheetForm({
  worksheetId,
  initialContent,
  initialLayout,
  aufgabeErgaenzenAnzahl,
  aufgabeErgaenzenMaximum,
}: {
  worksheetId: string;
  initialContent: WorksheetContent;
  initialLayout: LayoutConfig;
  // Wie oft "Aufgabe von KI erstellen" (siehe unten) für DIESES Arbeitsblatt schon genutzt wurde
  // - bewusst pro Arbeitsblatt begrenzt (siehe AUFGABE_ERGAENZEN_PRO_ARBEITSBLATT_MAXIMUM in
  // lib/aufgabeErgaenzen.ts), NICHT nur über ein tägliches Gesamtlimit: 1 reguläre Nutzung plus
  // 1 weitere, falls die KI inhaltlich danebenlag.
  aufgabeErgaenzenAnzahl: number;
  aufgabeErgaenzenMaximum: number;
}) {
  const router = useRouter();
  const [content, setContent] = useState<WorksheetContent>(initialContent);
  const [layout, setLayout] = useState<LayoutConfig>(initialLayout);
  const [loesungenByNr, setLoesungenByNr] = useState<Record<number, string>>(
    Object.fromEntries(initialContent.loesungen.map((l) => [l.nr, l.loesung])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hebt eine Aufgabe farblich hervor und scrollt sie ins Bild - entweder weil sie gerade über
  // eine der vier ADD_METHODEN entstanden ist, oder weil sie nach "Entfernen" per "Rückgängig"
  // wiederhergestellt wurde (siehe zuletztEntfernt unten). Der Hinweis zum Speichern steht direkt
  // AUF der hervorgehobenen Karte, nicht als separates Banner irgendwo anders auf der Seite.
  const [hervorgehobeneAufgabe, setHervorgehobeneAufgabe] = useState<{
    nr: number;
    grund: "hinzugefuegt" | "wiederhergestellt";
  } | null>(null);
  const hervorgehobeneAufgabeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (hervorgehobeneAufgabe !== null) {
      hervorgehobeneAufgabeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [hervorgehobeneAufgabe]);

  // Merkt sich genau EINE zuletzt entfernte Aufgabe (samt ihrer bisherigen Lösung und Position im
  // Array), damit "Entfernen" per Sicherheitsabfrage plus "Rückgängig"-Banner rückgängig gemacht
  // werden kann, falls es versehentlich doch passiert ist. Wird bei jedem Hinzufügen einer neuen
  // Aufgabe geleert (nicht nur beim Wiederherstellen): naechsteNr() vergibt sonst potenziell
  // dieselbe Nummer erneut, die die entfernte Aufgabe noch trägt - eine spätere Wiederherstellung
  // würde dann zwei Aufgaben mit identischer "nr" erzeugen (kollidierender React-Key UND
  // überschriebener loesungenByNr-Eintrag). Solange nichts Neues hinzugefügt wurde, ist die
  // gemerkte Position im Array garantiert noch gültig.
  const [zuletztEntfernt, setZuletztEntfernt] = useState<{
    aufgabe: Aufgabe;
    loesung: string;
    index: number;
  } | null>(null);

  function updateAufgabe(nr: number, patch: Partial<Aufgabe>) {
    setContent((c) => ({
      ...c,
      aufgaben: c.aufgaben.map((a) => (a.nr === nr ? { ...a, ...patch } : a)),
    }));
  }

  function removeAufgabe(nr: number) {
    const index = content.aufgaben.findIndex((a) => a.nr === nr);
    const aufgabe = content.aufgaben[index];
    if (!aufgabe) return;
    const bezeichnung = aufgabe.frage.trim() || TYP_LABEL[aufgabe.typ];
    if (!window.confirm(`Aufgabe „${bezeichnung}" wirklich entfernen?`)) return;

    setZuletztEntfernt({ aufgabe, loesung: loesungenByNr[nr] ?? "", index });
    setContent((c) => ({ ...c, aufgaben: c.aufgaben.filter((a) => a.nr !== nr) }));
    setLoesungenByNr((l) => {
      const rest = { ...l };
      delete rest[nr];
      return rest;
    });
    setHervorgehobeneAufgabe((aktuell) => (aktuell?.nr === nr ? null : aktuell));
  }

  function aufgabeWiederherstellen() {
    if (!zuletztEntfernt) return;
    const { aufgabe, loesung, index } = zuletztEntfernt;
    setContent((c) => {
      const aufgaben = [...c.aufgaben];
      aufgaben.splice(Math.min(index, aufgaben.length), 0, aufgabe);
      return { ...c, aufgaben };
    });
    setLoesungenByNr((l) => ({ ...l, [aufgabe.nr]: loesung }));
    setZuletztEntfernt(null);
    setHervorgehobeneAufgabe({ nr: aufgabe.nr, grund: "wiederhergestellt" });
  }

  // "Aufgabe hinzufügen" bietet vier Methoden (siehe ADD_METHODEN oben): "Leer" (manuell
  // ausfüllen, kein Aufruf), "Von KI erstellen" (ein Claude-Aufruf, begrenzt siehe
  // aufgabeErgaenzenMaximum), sowie "Hadith"/"Koran-Vers" (direkte Übernahme eines bereits
  // geprüften Texts aus der Wissensbasis bzw. live von der Koran-API als Lesetext-Aufgabe - kein
  // Claude-Aufruf, kein Limit). In allen vier Fällen landet das Ergebnis in content.aufgaben und
  // bleibt danach genauso frei editierbar/entfernbar wie jede andere Aufgabe (siehe
  // updateAufgabe/removeAufgabe).
  const [generatorOffen, setGeneratorOffen] = useState(false);
  const [addMethode, setAddMethode] = useState<AddMethode>("leer");
  const [generatorTyp, setGeneratorTyp] = useState<(typeof AUFGABEN_TYPEN_AKTIV)[number]>(
    AUFGABEN_TYPEN_AKTIV[0],
  );
  const [generatorKomplexitaet, setGeneratorKomplexitaet] = useState<Komplexitaet>("mittel");
  const [generatorAnforderungsbereich, setGeneratorAnforderungsbereich] = useState<
    AnforderungsbereichKey | ""
  >("");
  const [generatorVorgabe, setGeneratorVorgabe] = useState("");
  const [generatorLaden, setGeneratorLaden] = useState(false);
  const [generatorFehler, setGeneratorFehler] = useState<string | null>(null);
  const [generatorVerbleibend, setGeneratorVerbleibend] = useState<number | null>(null);
  // Pro-Arbeitsblatt-Limit (siehe Props oben) - die eigentliche Missbrauchsbremse, strenger als
  // das globale Tageslimit (generatorVerbleibend): startet mit dem beim Laden der Seite bereits
  // verbrauchten Stand und wird nach jeder erfolgreichen Nutzung lokal weitergezählt.
  const [verbrauchtProArbeitsblatt, setVerbrauchtProArbeitsblatt] = useState(aufgabeErgaenzenAnzahl);
  const proArbeitsblattLimitErreicht = verbrauchtProArbeitsblatt >= aufgabeErgaenzenMaximum;

  function typBereitsVoll(typ: (typeof AUFGABEN_TYPEN_AKTIV)[number]): boolean {
    const maximum = AUFGABEN_TYP_MAXIMUM[typ];
    if (maximum === undefined) return false;
    return content.aufgaben.filter((a) => a.typ === typ).length >= maximum;
  }

  async function generiereAufgabe() {
    setGeneratorFehler(null);
    setGeneratorLaden(true);
    try {
      const res = await fetch(`/api/worksheet/${worksheetId}/aufgabe-generieren`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aufgabentyp: generatorTyp,
          komplexitaet: generatorKomplexitaet,
          anforderungsbereich: generatorAnforderungsbereich || undefined,
          vorgabe: generatorVorgabe || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Aufgabe konnte nicht erstellt werden.");

      const nr = naechsteNr(content.aufgaben);
      const neueAufgabe: Aufgabe = { ...data.aufgabe, nr };
      setContent((c) => ({ ...c, aufgaben: [...c.aufgaben, neueAufgabe] }));
      setLoesungenByNr((l) => ({ ...l, [nr]: data.loesung ?? "" }));
      setHervorgehobeneAufgabe({ nr, grund: "hinzugefuegt" });
      setZuletztEntfernt(null);
      setGeneratorVerbleibend(typeof data.verbleibend === "number" ? data.verbleibend : null);
      setVerbrauchtProArbeitsblatt((v) =>
        typeof data.verbleibendProArbeitsblatt === "number"
          ? aufgabeErgaenzenMaximum - data.verbleibendProArbeitsblatt
          : v + 1,
      );
      setGeneratorOffen(false);
      setGeneratorVorgabe("");
    } catch (err) {
      setGeneratorFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setGeneratorLaden(false);
    }
  }

  // Methode "Leer" - genau das ursprüngliche, einfache Verhalten (kein Aufruf, keine Kosten):
  // eine leere Aufgabe des gewählten Typs, die die Lehrkraft direkt in den unten gerenderten
  // typ-spezifischen Feldern selbst ausfüllt.
  function fuegeLeereAufgabeEin() {
    const nr = naechsteNr(content.aufgaben);
    setContent((c) => ({ ...c, aufgaben: [...c.aufgaben, { nr, typ: generatorTyp, frage: "" }] }));
    setLoesungenByNr((l) => ({ ...l, [nr]: "" }));
    setHervorgehobeneAufgabe({ nr, grund: "hinzugefuegt" });
    setZuletztEntfernt(null);
    setGeneratorOffen(false);
  }

  // Methoden "Hadith"/"Koran-Vers" - beide übernehmen einen bereits geprüften Text (Wissensbasis
  // bzw. live Koran-API) unverändert als "lesetext"-Aufgabe samt automatischer Quellenangabe,
  // ohne Claude-Aufruf. Die "frage" bekommt bewusst eine editierbare Platzhalter-Frage statt einer
  // KI-generierten - die Lehrkraft soll die eigentliche Aufgabenstellung dazu selbst formulieren.
  function fuegeLesetextAufgabeEin(lesetext: string, quelleBezeichnung: string, platzhalterFrage: string) {
    const nr = naechsteNr(content.aufgaben);
    const neueAufgabe: Aufgabe = { nr, typ: "lesetext", lesetext, frage: platzhalterFrage };
    setContent((c) => ({
      ...c,
      aufgaben: [...c.aufgaben, neueAufgabe],
      quellen: [...c.quellen, { bezeichnung: quelleBezeichnung, sicherheit: "gesichert" }],
    }));
    setLoesungenByNr((l) => ({ ...l, [nr]: "" }));
    setHervorgehobeneAufgabe({ nr, grund: "hinzugefuegt" });
    setZuletztEntfernt(null);
    setGeneratorOffen(false);
  }

  const [hadithe, setHadithe] = useState<HadithListeneintrag[] | null>(null);
  const [hadithLaden, setHadithLaden] = useState(false);
  const [hadithFehler, setHadithFehler] = useState<string | null>(null);
  const [hadithSuche, setHadithSuche] = useState("");
  const [hadithAuswahlId, setHadithAuswahlId] = useState("");
  const [hadithUebernehmenLaden, setHadithUebernehmenLaden] = useState(false);

  async function ladeHadithe() {
    setHadithLaden(true);
    setHadithFehler(null);
    try {
      const res = await fetch("/api/hadithe");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Hadith-Liste konnte nicht geladen werden.");
      const liste = data.hadithe as HadithListeneintrag[];
      setHadithe(liste);
      if (!hadithAuswahlId && liste.length > 0) setHadithAuswahlId(liste[0].id);
    } catch (err) {
      setHadithFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setHadithLaden(false);
    }
  }

  useEffect(() => {
    if (addMethode === "hadith" && !hadithe && !hadithLaden) ladeHadithe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMethode]);

  const gefilterteHadithe = (hadithe ?? []).filter((h) => {
    if (!hadithSuche.trim()) return true;
    const suche = hadithSuche.trim().toLowerCase();
    return h.bezeichnung.toLowerCase().includes(suche) || (h.textVorschau ?? "").toLowerCase().includes(suche);
  });

  async function uebernehmeHadith() {
    if (!hadithAuswahlId) return;
    setHadithFehler(null);
    setHadithUebernehmenLaden(true);
    try {
      const res = await fetch(`/api/hadithe/${hadithAuswahlId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Hadith konnte nicht geladen werden.");
      fuegeLesetextAufgabeEin(
        data.text,
        data.bezeichnung,
        "Was ist die wichtigste Aussage dieses Hadith? Erkläre sie in eigenen Worten.",
      );
    } catch (err) {
      setHadithFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setHadithUebernehmenLaden(false);
    }
  }

  const [suren, setSuren] = useState<SurahMeta[] | null>(null);
  const [surenLaden, setSurenLaden] = useState(false);
  const [surenFehler, setSurenFehler] = useState<string | null>(null);
  const [koranSureNummer, setKoranSureNummer] = useState(1);
  const [koranVonVers, setKoranVonVers] = useState(1);
  const [koranBisVers, setKoranBisVers] = useState(7);
  const [koranVersLaden, setKoranVersLaden] = useState(false);
  const [koranVersFehler, setKoranVersFehler] = useState<string | null>(null);

  async function ladeSuren() {
    setSurenLaden(true);
    setSurenFehler(null);
    try {
      const res = await fetch("/api/koran/suren");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Suren-Liste konnte nicht geladen werden.");
      setSuren(data.suren as SurahMeta[]);
    } catch (err) {
      setSurenFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setSurenLaden(false);
    }
  }

  useEffect(() => {
    if (addMethode === "koranvers" && !suren && !surenLaden) ladeSuren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMethode]);

  async function uebernehmeKoranVers() {
    if (koranBisVers - koranVonVers + 1 > MAX_VERSE_PRO_ABFRAGE) {
      setKoranVersFehler(`Bitte höchstens ${MAX_VERSE_PRO_ABFRAGE} Verse auswählen.`);
      return;
    }
    setKoranVersFehler(null);
    setKoranVersLaden(true);
    try {
      const params = new URLSearchParams({
        sureNummer: String(koranSureNummer),
        vonVers: String(koranVonVers),
        bisVers: String(koranBisVers),
      });
      const res = await fetch(`/api/koran/vers?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Vers konnte nicht abgerufen werden.");
      fuegeLesetextAufgabeEin(
        data.text,
        data.bezeichnung,
        "Was ist die wichtigste Aussage dieses Verses? Erkläre sie in eigenen Worten.",
      );
    } catch (err) {
      setKoranVersFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setKoranVersLaden(false);
    }
  }

  function updateQuelle(index: number, patch: Partial<Quelle>) {
    setContent((c) => ({
      ...c,
      quellen: c.quellen.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
  }

  function removeQuelle(index: number) {
    setContent((c) => ({ ...c, quellen: c.quellen.filter((_, i) => i !== index) }));
  }

  function addQuelle() {
    setContent((c) => ({
      ...c,
      quellen: [...c.quellen, { bezeichnung: "", sicherheit: "bitte_pruefen" }],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const finalContent: WorksheetContent = {
      ...content,
      loesungen: content.aufgaben.map((a) => ({
        nr: a.nr,
        loesung: loesungenByNr[a.nr] ?? "",
      })),
    };

    try {
      const res = await fetch(`/api/worksheet/${worksheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: finalContent, layout }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      }
      router.push(`/worksheet/${worksheetId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionCard icon={FileEdit} title="Kopfdaten">
        <label className="mb-4 block">
          <span className={labelClass}>Titel</span>
          <input
            className={inputClass}
            value={content.titel}
            onChange={(e) => setContent((c) => ({ ...c, titel: e.target.value }))}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Fach</span>
            <input
              className={inputClass}
              value={content.fach}
              onChange={(e) => setContent((c) => ({ ...c, fach: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Schulstufe</span>
            <input
              className={inputClass}
              value={content.schulstufe}
              onChange={(e) => setContent((c) => ({ ...c, schulstufe: e.target.value }))}
            />
          </label>
        </div>
        <label className="mt-4 block">
          <span className={labelClass}>Thema</span>
          <input
            className={inputClass}
            value={content.thema}
            onChange={(e) => setContent((c) => ({ ...c, thema: e.target.value }))}
          />
        </label>
        <label className="mt-4 block">
          <span className={labelClass}>Lernziel</span>
          <textarea
            className={inputClass}
            rows={2}
            value={content.lernziel}
            onChange={(e) => setContent((c) => ({ ...c, lernziel: e.target.value }))}
          />
        </label>
        <label className="mt-4 block">
          <span className={labelClass}>Einleitung</span>
          <textarea
            className={inputClass}
            rows={3}
            value={content.einleitung}
            onChange={(e) => setContent((c) => ({ ...c, einleitung: e.target.value }))}
          />
        </label>
      </SectionCard>

      <SectionCard icon={LayoutTemplate} title="Layout">
        <span className={labelClass}>Vorlage</span>
        <div className="mb-5 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => {
            const meta = TEMPLATE_META[t];
            const active = layout.template === t;
            return (
              <button
                type="button"
                key={t}
                onClick={() => setLayout((l) => ({ ...l, template: t }))}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                  active ? SEKTION_FARBEN.brand.aktiv : CHIP_BASIS
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.swatch }} />
                {meta.label}
              </button>
            );
          })}
        </div>
        <span className={labelClass}>Druckfarbe</span>
        <div className="mb-5 flex flex-wrap gap-2">
          {FARBMODI.map((f) => {
            const active = layout.farbmodus === f;
            return (
              <button
                type="button"
                key={f}
                onClick={() => setLayout((l) => ({ ...l, farbmodus: f }))}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                  active ? SEKTION_FARBEN.brand.aktiv : CHIP_BASIS
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full border border-slate-300"
                  style={{ backgroundColor: f === "farbe" ? "#0e6b4a" : "#1a1a1a" }}
                />
                {f === "farbe" ? "Farbe" : "Schwarz-Weiß"}
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Schulname (optional, im Kopf)</span>
            <input
              className={inputClass}
              value={layout.schulname ?? ""}
              onChange={(e) => setLayout((l) => ({ ...l, schulname: e.target.value || undefined }))}
              placeholder="z.B. Islamische Volksschule Wien"
            />
          </label>
          <label className="block">
            <span className={labelClass}>Schriftgröße</span>
            <select
              className={inputClass}
              value={layout.schriftgroesse}
              onChange={(e) =>
                setLayout((l) => ({ ...l, schriftgroesse: e.target.value as "normal" | "gross" }))
              }
            >
              <option value="normal">Normal</option>
              <option value="gross">Groß</option>
            </select>
          </label>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          Lösungen erscheinen immer auf einem separaten Blatt bzw. Dokumentabschnitt, nie auf dem
          Arbeitsblatt selbst.
        </p>
        <div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/60 px-4">
          <ToggleSwitch
            checked={layout.zeigeIslamischesDatum}
            onChange={(v) => setLayout((l) => ({ ...l, zeigeIslamischesDatum: v }))}
            label="Datum im Kopfbereich anzeigen (gregorianisch + Hijri)"
            description="Nur sinnvoll, wenn am Drucktag ausgeteilt wird - sonst bekommt der Schüler stattdessen ein Datumsfeld zum Selbst-Ausfüllen"
          />
          <ToggleSwitch
            checked={layout.zeigeMuster}
            onChange={(v) => setLayout((l) => ({ ...l, zeigeMuster: v }))}
            label="Islamisches Ornament-Muster anzeigen"
            description="Dezenter Zierstreifen im Kopfbereich"
          />
          <ToggleSwitch
            checked={layout.zeigeLernziel}
            onChange={(v) => setLayout((l) => ({ ...l, zeigeLernziel: v }))}
            label="Lernziel-Abschnitt auf dem Arbeitsblatt anzeigen"
            description="Standardmäßig aus – nur einblenden, wenn gewünscht"
          />
          <ToggleSwitch
            checked={layout.zeigeNamensfeld}
            onChange={(v) => setLayout((l) => ({ ...l, zeigeNamensfeld: v }))}
            label="Namensfeld (Name / Klasse / Datum) anzeigen"
            description="Zum Ausfüllen von Hand - abschaltbar, wenn nicht an einzelne Schüler:innen ausgeteilt wird"
          />
        </div>
        {layout.zeigeMuster && (
          <div className="mt-4">
            <span className={labelClass}>Musterauswahl</span>
            <div className="grid grid-cols-2 gap-2">
              {MUSTER_VARIANTEN.map((v) => {
                const active = layout.musterVariante === v;
                return (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setLayout((l) => ({ ...l, musterVariante: v }))}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 transition ${
                      active ? "border-brand-600 bg-brand-50" : CHIP_BASIS
                    }`}
                  >
                    <div className="flex h-5 w-full items-center justify-center overflow-hidden">
                      <IslamicPatternStrip variante={v} hoehe={20} />
                    </div>
                    <span className={`text-xs font-medium ${active ? "text-brand-700" : "text-slate-500"}`}>
                      {MUSTER_LABEL[v]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={ListChecks}
        title="Aufgaben & Lösungen"
        action={
          <button
            type="button"
            onClick={() => setGeneratorOffen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
          >
            <Plus size={14} strokeWidth={2.5} />
            Aufgabe hinzufügen
          </button>
        }
      >
        {generatorOffen && (
          <div className="mb-5 space-y-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
            <div className="flex flex-wrap gap-2">
              {ADD_METHODEN.map((methode) => {
                const gesperrt = methode.key === "ki" && proArbeitsblattLimitErreicht;
                const aktiv = addMethode === methode.key;
                return (
                  <button
                    type="button"
                    key={methode.key}
                    onClick={() => setAddMethode(methode.key)}
                    disabled={gesperrt}
                    title={
                      gesperrt
                        ? `Für dieses Arbeitsblatt bereits ${aufgabeErgaenzenMaximum}× genutzt (Höchstgrenze erreicht).`
                        : undefined
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      aktiv
                        ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <methode.icon size={14} strokeWidth={2.25} />
                    {methode.label}
                  </button>
                );
              })}
            </div>

            {addMethode === "leer" && (
              <div className="space-y-3">
                <label className="block max-w-sm">
                  <span className={labelClass}>Aufgabentyp</span>
                  <select
                    className={inputClass}
                    value={generatorTyp}
                    onChange={(e) =>
                      setGeneratorTyp(e.target.value as (typeof AUFGABEN_TYPEN_AKTIV)[number])
                    }
                  >
                    {AUFGABEN_TYPEN_AKTIV.map((typ) => (
                      <option key={typ} value={typ} disabled={typBereitsVoll(typ)}>
                        {TYP_LABEL[typ]}
                        {typBereitsVoll(typ) ? " (Maximum erreicht)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fuegeLeereAufgabeEin}
                    disabled={typBereitsVoll(generatorTyp)}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-card-hover disabled:opacity-60"
                  >
                    <Plus size={14} />
                    Hinzufügen
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneratorOffen(false)}
                    className="text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {addMethode === "ki" && !proArbeitsblattLimitErreicht && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Aufgabentyp</span>
                    <select
                      className={inputClass}
                      value={generatorTyp}
                      onChange={(e) =>
                        setGeneratorTyp(e.target.value as (typeof AUFGABEN_TYPEN_AKTIV)[number])
                      }
                    >
                      {AUFGABEN_TYPEN_AKTIV.map((typ) => (
                        <option key={typ} value={typ} disabled={typBereitsVoll(typ)}>
                          {TYP_LABEL[typ]}
                          {typBereitsVoll(typ) ? " (Maximum erreicht)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Komplexität</span>
                    <select
                      className={inputClass}
                      value={generatorKomplexitaet}
                      onChange={(e) => setGeneratorKomplexitaet(e.target.value as Komplexitaet)}
                    >
                      {KOMPLEXITAET_STUFEN.map((stufe) => (
                        <option key={stufe} value={stufe}>
                          {KOMPLEXITAET_LABEL[stufe]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block max-w-sm">
                  <span className={labelClass}>Anforderungsbereich (optional)</span>
                  <select
                    className={inputClass}
                    value={generatorAnforderungsbereich}
                    onChange={(e) =>
                      setGeneratorAnforderungsbereich(e.target.value as AnforderungsbereichKey | "")
                    }
                  >
                    <option value="">— dem Modell überlassen —</option>
                    {ANFORDERUNGSBEREICHE_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {ANFORDERUNGSBEREICHE[key].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Zusätzlicher Wunsch (optional)</span>
                  <input
                    className={inputClass}
                    value={generatorVorgabe}
                    onChange={(e) => setGeneratorVorgabe(e.target.value)}
                    placeholder="z.B. Frage zu den Namen Allahs stellen"
                    maxLength={300}
                  />
                </label>
                {generatorFehler && <p className="text-sm text-red-600">{generatorFehler}</p>}
                <p className="text-xs text-slate-400">
                  Noch {Math.max(0, aufgabeErgaenzenMaximum - verbrauchtProArbeitsblatt)} von{" "}
                  {aufgabeErgaenzenMaximum} Malen für dieses Arbeitsblatt verfügbar
                  {generatorVerbleibend !== null ? ` (max. ${generatorVerbleibend}× heute insgesamt).` : "."}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={generiereAufgabe}
                    disabled={generatorLaden || typBereitsVoll(generatorTyp)}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-card-hover disabled:opacity-60"
                  >
                    <Sparkles size={14} />
                    {generatorLaden ? "Wird erstellt …" : "Erstellen"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneratorOffen(false)}
                    className="text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
            {addMethode === "ki" && proArbeitsblattLimitErreicht && (
              <p className="text-xs leading-relaxed text-slate-500">
                "Von KI erstellen" wurde für dieses Arbeitsblatt bereits {aufgabeErgaenzenMaximum}×
                genutzt (Höchstgrenze pro Arbeitsblatt, gegen Missbrauch) - eine leere Aufgabe,
                ein Hadith oder ein Koran-Vers lassen sich aber weiterhin unbegrenzt hinzufügen.
              </p>
            )}

            {addMethode === "hadith" && (
              <div className="space-y-3">
                {hadithLaden && <p className="text-xs text-slate-400">Hadith-Liste wird geladen …</p>}
                {hadithFehler && (
                  <p className="text-xs text-red-600">
                    {hadithFehler}{" "}
                    <button type="button" onClick={ladeHadithe} className="underline">
                      Erneut versuchen
                    </button>
                  </p>
                )}
                {hadithe && hadithe.length === 0 && (
                  <p className="text-xs leading-relaxed text-slate-500">
                    Noch keine geprüften Hadithe in der Wissensbasis hinterlegt.
                  </p>
                )}
                {hadithe && hadithe.length > 0 && (
                  <>
                    <label className="block">
                      <span className={labelClass}>Suche</span>
                      <input
                        type="text"
                        className={inputClass}
                        value={hadithSuche}
                        onChange={(e) => setHadithSuche(e.target.value)}
                        placeholder="z.B. Absicht, Barmherzigkeit …"
                      />
                    </label>
                    {gefilterteHadithe.length === 0 ? (
                      <p className="text-xs text-slate-500">Kein Hadith passt zur aktuellen Suche.</p>
                    ) : (
                      <label className="block">
                        <span className={labelClass}>Hadith</span>
                        <select
                          className={inputClass}
                          value={hadithAuswahlId}
                          onChange={(e) => setHadithAuswahlId(e.target.value)}
                        >
                          {gefilterteHadithe.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.bezeichnung}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={uebernehmeHadith}
                        disabled={hadithUebernehmenLaden || !hadithAuswahlId}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-card-hover disabled:opacity-60"
                      >
                        <Quote size={14} />
                        {hadithUebernehmenLaden ? "Wird übernommen …" : "Übernehmen"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setGeneratorOffen(false)}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {addMethode === "koranvers" && (
              <div className="space-y-3">
                {surenLaden && <p className="text-xs text-slate-400">Suren-Liste wird geladen …</p>}
                {surenFehler && (
                  <p className="text-xs text-red-600">
                    {surenFehler}{" "}
                    <button type="button" onClick={ladeSuren} className="underline">
                      Erneut versuchen
                    </button>
                  </p>
                )}
                {suren && (
                  <>
                    <label className="block max-w-sm">
                      <span className={labelClass}>Sure</span>
                      <select
                        className={inputClass}
                        value={koranSureNummer}
                        onChange={(e) => {
                          const nummer = Number(e.target.value);
                          setKoranSureNummer(nummer);
                          setKoranVonVers(1);
                          const meta = suren.find((s) => s.nummer === nummer);
                          if (meta) setKoranBisVers(Math.min(meta.verseAnzahl, MAX_VERSE_PRO_ABFRAGE));
                        }}
                      >
                        {suren.map((s) => (
                          <option key={s.nummer} value={s.nummer}>
                            {s.nummer}. {s.nameTransliteriert} ({s.verseAnzahl} Verse)
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="block">
                        <span className={labelClass}>Vers von</span>
                        <input
                          type="number"
                          min={1}
                          className={`${inputClass} w-24`}
                          value={koranVonVers}
                          onChange={(e) => setKoranVonVers(Math.max(1, Number(e.target.value) || 1))}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>bis</span>
                        <input
                          type="number"
                          min={koranVonVers}
                          className={`${inputClass} w-24`}
                          value={koranBisVers}
                          onChange={(e) =>
                            setKoranBisVers(Math.max(koranVonVers, Number(e.target.value) || koranVonVers))
                          }
                        />
                      </label>
                    </div>
                    {koranBisVers - koranVonVers + 1 > MAX_VERSE_PRO_ABFRAGE && (
                      <p className="text-xs text-red-600">
                        Höchstens {MAX_VERSE_PRO_ABFRAGE} Verse - bitte den Bereich verkleinern.
                      </p>
                    )}
                    {koranVersFehler && <p className="text-xs text-red-600">{koranVersFehler}</p>}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={uebernehmeKoranVers}
                        disabled={koranVersLaden}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-card-hover disabled:opacity-60"
                      >
                        <BookOpenText size={14} />
                        {koranVersLaden ? "Wird übernommen …" : "Übernehmen"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setGeneratorOffen(false)}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {zuletztEntfernt && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>
              Aufgabe entfernt: „
              {zuletztEntfernt.aufgabe.frage.trim() || TYP_LABEL[zuletztEntfernt.aufgabe.typ]}"
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={aufgabeWiederherstellen}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
              >
                <RotateCcw size={14} />
                Rückgängig
              </button>
              <button
                type="button"
                onClick={() => setZuletztEntfernt(null)}
                aria-label="Meldung schließen"
                className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-100 hover:text-amber-700"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        <div className="space-y-5">
          {content.aufgaben.map((a) => {
            const istHervorgehoben = hervorgehobeneAufgabe?.nr === a.nr;
            return (
            <div
              key={a.nr}
              ref={istHervorgehoben ? hervorgehobeneAufgabeRef : undefined}
              className={`rounded-xl border p-4 transition-colors ${
                istHervorgehoben
                  ? "border-brand-400 bg-brand-50/70 ring-2 ring-brand-200"
                  : "border-slate-200 bg-slate-50/40"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {a.nr}. {TYP_LABEL[a.typ]}
                </span>
                <RemoveButton onClick={() => removeAufgabe(a.nr)} />
              </div>
              {istHervorgehoben && (
                <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-brand-100/70 px-3 py-2 text-xs font-medium text-brand-800">
                  {hervorgehobeneAufgabe.grund === "wiederhergestellt" ? (
                    <RotateCcw size={13} className="shrink-0" />
                  ) : (
                    <Sparkles size={13} className="shrink-0" />
                  )}
                  {hervorgehobeneAufgabe.grund === "wiederhergestellt"
                    ? "Wiederhergestellt"
                    : "Neu hinzugefügt"}{" "}
                  - nicht vergessen, unten auf „Änderungen speichern" zu klicken.
                </p>
              )}
              <label className="mb-3 block max-w-sm">
                <span className={labelClass}>Anforderungsbereich</span>
                <select
                  className={inputClass}
                  value={a.anforderungsbereich ?? ""}
                  onChange={(e) =>
                    updateAufgabe(a.nr, {
                      anforderungsbereich: (e.target.value || undefined) as
                        | AnforderungsbereichKey
                        | undefined,
                    })
                  }
                >
                  <option value="">— nicht gesetzt —</option>
                  {ANFORDERUNGSBEREICHE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {ANFORDERUNGSBEREICHE[key].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mb-3 block">
                <span className={labelClass}>Frage</span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={a.frage}
                  onChange={(e) => updateAufgabe(a.nr, { frage: e.target.value })}
                />
              </label>

              {a.typ === "multiple_choice" && (
                <div className="mb-3">
                  <span className={labelClass}>Optionen</span>
                  {(a.optionen ?? []).map((opt, i) => (
                    <input
                      key={i}
                      className={`${inputClass} mb-1.5`}
                      value={opt}
                      onChange={(e) => {
                        const optionen = [...(a.optionen ?? [])];
                        optionen[i] = e.target.value;
                        updateAufgabe(a.nr, { optionen });
                      }}
                    />
                  ))}
                </div>
              )}

              {a.typ === "zuordnung" && (
                <div className="mb-3 space-y-1.5">
                  <span className={labelClass}>Zuordnungspaare (jeweils richtiges Paar)</span>
                  <p className="mb-1 text-xs text-slate-400">
                    Auf dem gedruckten Blatt wird die rechte Spalte automatisch gemischt und mit
                    Buchstaben versehen (a, b, c, ...) - die hier eingegebene Reihenfolge ist nur
                    die richtige Zuordnung, keine Druck-Reihenfolge.
                  </p>
                  {(a.zuordnungLinks ?? []).map((left, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={`${inputClass} w-1/2`}
                        value={left}
                        onChange={(e) => {
                          const zuordnungLinks = [...(a.zuordnungLinks ?? [])];
                          zuordnungLinks[i] = e.target.value;
                          updateAufgabe(a.nr, { zuordnungLinks });
                        }}
                      />
                      <input
                        className={`${inputClass} w-1/2`}
                        value={a.zuordnungRechts?.[i] ?? ""}
                        onChange={(e) => {
                          const zuordnungRechts = [...(a.zuordnungRechts ?? [])];
                          zuordnungRechts[i] = e.target.value;
                          updateAufgabe(a.nr, { zuordnungRechts });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {a.typ === "lueckentext" && (
                <label className="mb-3 block">
                  <span className={labelClass}>Wortliste (durch Komma getrennt)</span>
                  <input
                    className={inputClass}
                    value={(a.wortliste ?? []).join(", ")}
                    onChange={(e) => {
                      const wortliste = e.target.value
                        .split(",")
                        .map((w) => w.trim())
                        .filter((w) => w.length > 0);
                      updateAufgabe(a.nr, { wortliste });
                    }}
                  />
                </label>
              )}

              {a.typ === "reihenfolge" && (
                <label className="mb-3 block">
                  <span className={labelClass}>Elemente in der richtigen Reihenfolge (eine Zeile pro Element)</span>
                  <p className="mb-1 text-xs text-slate-400">
                    Auf dem gedruckten Blatt wird die Reihenfolge automatisch gemischt - hier die
                    tatsächlich richtige Abfolge eintragen.
                  </p>
                  <textarea
                    className={inputClass}
                    rows={Math.max(3, (a.reihenfolgeElemente ?? []).length)}
                    value={(a.reihenfolgeElemente ?? []).join("\n")}
                    onChange={(e) => {
                      const reihenfolgeElemente = e.target.value
                        .split("\n")
                        .map((w) => w.trim())
                        .filter((w) => w.length > 0);
                      updateAufgabe(a.nr, { reihenfolgeElemente });
                    }}
                  />
                </label>
              )}

              {a.typ === "lesetext" && (
                <label className="mb-3 block">
                  <span className={labelClass}>Lesetext</span>
                  <textarea
                    className={inputClass}
                    rows={4}
                    value={a.lesetext ?? ""}
                    onChange={(e) => updateAufgabe(a.nr, { lesetext: e.target.value })}
                  />
                </label>
              )}

              {a.typ === "reihenfolge" && (
                <label className="mb-3 block">
                  <span className={labelClass}>Kontext-Text (optional)</span>
                  <p className="mb-1 text-xs text-slate-400">
                    Nur nötig, wenn die richtige Reihenfolge nicht aus Allgemeinwissen ableitbar
                    ist - dann hier die Informationen liefern, aus denen sich die Reihenfolge
                    beim Lesen erschließt.
                  </p>
                  <textarea
                    className={inputClass}
                    rows={4}
                    value={a.lesetext ?? ""}
                    onChange={(e) => updateAufgabe(a.nr, { lesetext: e.target.value })}
                  />
                </label>
              )}

              {a.typ === "wortsuche" && (
                <label className="mb-3 block">
                  <span className={labelClass}>Gesuchte Wörter (durch Komma getrennt)</span>
                  <input
                    className={inputClass}
                    defaultValue={(a.wortsucheWoerter ?? []).join(", ")}
                    onBlur={(e) => {
                      const eingabe = e.target.value
                        .split(",")
                        .map((w) => w.trim())
                        .filter((w) => w.length > 0);
                      const ergebnis = erzeugeWortsucheGitter(eingabe);
                      updateAufgabe(a.nr, {
                        wortsucheWoerter: ergebnis ? ergebnis.platzierteWoerter : eingabe,
                        wortsucheGitter: ergebnis?.gitter,
                      });
                    }}
                  />
                  <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                    Beim Verlassen des Felds wird das Buchstabengitter automatisch neu erzeugt.
                  </span>
                </label>
              )}

              {a.typ === "kreuzwortraetsel" && (
                <div className="mb-3 space-y-1.5">
                  <span className={labelClass}>Hinweise &amp; Antworten</span>
                  <p className="mb-1 text-xs text-slate-400">
                    Antworten bitte in Großbuchstaben ohne Umlaute/Leerzeichen. Beim Verlassen
                    eines Felds wird das Gitter automatisch neu erzeugt.
                  </p>
                  {(a.kreuzwortEintraege ?? []).map((eintrag, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={`${inputClass} w-2/3`}
                        placeholder="Hinweis"
                        defaultValue={eintrag.frage}
                        onBlur={(e) => {
                          const kreuzwortEintraege = [...(a.kreuzwortEintraege ?? [])];
                          kreuzwortEintraege[i] = { ...kreuzwortEintraege[i], frage: e.target.value };
                          const ergebnis = erzeugeKreuzwortraetsel(kreuzwortEintraege);
                          updateAufgabe(a.nr, {
                            kreuzwortEintraege,
                            kreuzwortGitter: ergebnis?.gitter,
                            kreuzwortWaagerecht: ergebnis?.waagerecht,
                            kreuzwortSenkrecht: ergebnis?.senkrecht,
                          });
                        }}
                      />
                      <input
                        className={`${inputClass} w-1/3`}
                        placeholder="Antwort"
                        defaultValue={eintrag.antwort}
                        onBlur={(e) => {
                          const kreuzwortEintraege = [...(a.kreuzwortEintraege ?? [])];
                          kreuzwortEintraege[i] = { ...kreuzwortEintraege[i], antwort: e.target.value };
                          const ergebnis = erzeugeKreuzwortraetsel(kreuzwortEintraege);
                          updateAufgabe(a.nr, {
                            kreuzwortEintraege,
                            kreuzwortGitter: ergebnis?.gitter,
                            kreuzwortWaagerecht: ergebnis?.waagerecht,
                            kreuzwortSenkrecht: ergebnis?.senkrecht,
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {a.typ === "ausmalbild" && (
                <div className="mb-3 flex items-end gap-3">
                  <label className="block max-w-xs flex-1">
                    <span className={labelClass}>Bild</span>
                    <IconSelect
                      value={a.bild}
                      onChange={(bild) => updateAufgabe(a.nr, { bild, bildGeneriertId: undefined })}
                    />
                    {a.bildGeneriertId && (
                      <span className="mt-1 block text-xs text-slate-400">
                        Aktuell ein per KI generiertes Motiv - hier ein festes Bild auswählen, um es zu ersetzen.
                      </span>
                    )}
                  </label>
                  {a.bildGeneriertId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={generiertesBildPfadWeb(a.bildGeneriertId)} alt="" className="h-14 w-auto" />
                  ) : (
                    a.bild && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={iconPfadWeb(a.bild)} alt="" className="h-14 w-auto" />
                    )
                  )}
                </div>
              )}

              {a.typ === "bildergeschichte" && (
                <div className="mb-3 space-y-2">
                  <span className={labelClass}>Bildschritte</span>
                  {(a.bildergeschichteSchritte ?? []).map((schritt, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-surface p-2.5">
                      {schritt.bildGeneriertId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={generiertesBildPfadWeb(schritt.bildGeneriertId)}
                          alt=""
                          className="mt-1 h-10 w-auto shrink-0"
                        />
                      ) : (
                        schritt.bild && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={iconPfadWeb(schritt.bild)} alt="" className="mt-1 h-10 w-auto shrink-0" />
                        )
                      )}
                      <div className="flex-1 space-y-1.5">
                        <IconSelect
                          value={schritt.bild}
                          onChange={(bild) => {
                            const schritte: BildergeschichteSchritt[] = [...(a.bildergeschichteSchritte ?? [])];
                            schritte[i] = { ...schritte[i], bild, bildGeneriertId: undefined };
                            updateAufgabe(a.nr, { bildergeschichteSchritte: schritte });
                          }}
                        />
                        <input
                          className={inputClass}
                          placeholder="Vorlesetext für die Lehrkraft"
                          value={schritt.vorlesetext}
                          onChange={(e) => {
                            const schritte: BildergeschichteSchritt[] = [...(a.bildergeschichteSchritte ?? [])];
                            schritte[i] = { ...schritte[i], vorlesetext: e.target.value };
                            updateAufgabe(a.nr, { bildergeschichteSchritte: schritte });
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const schritte = (a.bildergeschichteSchritte ?? []).filter((_, j) => j !== i);
                          updateAufgabe(a.nr, { bildergeschichteSchritte: schritte });
                        }}
                        className="mt-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <AddButton
                    onClick={() => {
                      const schritte: BildergeschichteSchritt[] = [
                        ...(a.bildergeschichteSchritte ?? []),
                        { bild: "halbmond", vorlesetext: "" },
                      ];
                      updateAufgabe(a.nr, { bildergeschichteSchritte: schritte });
                    }}
                  >
                    Schritt hinzufügen
                  </AddButton>
                </div>
              )}

              {a.typ === "recherche_auftrag" && (
                <div className="mb-3 space-y-3">
                  <label className="block">
                    <span className={labelClass}>Leitfaden (eine Zeile pro Recherchefrage)</span>
                    <textarea
                      className={inputClass}
                      rows={Math.max(3, (a.leitfaden ?? []).length)}
                      value={(a.leitfaden ?? []).join("\n")}
                      onChange={(e) => {
                        const leitfaden = e.target.value
                          .split("\n")
                          .map((w) => w.trim())
                          .filter((w) => w.length > 0);
                        updateAufgabe(a.nr, { leitfaden });
                      }}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Bewertungskriterien (eine Zeile pro Kriterium)</span>
                    <textarea
                      className={inputClass}
                      rows={Math.max(3, (a.bewertungskriterien ?? []).length)}
                      value={(a.bewertungskriterien ?? []).join("\n")}
                      onChange={(e) => {
                        const bewertungskriterien = e.target.value
                          .split("\n")
                          .map((w) => w.trim())
                          .filter((w) => w.length > 0);
                        updateAufgabe(a.nr, { bewertungskriterien });
                      }}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Hinweis zu Quellen</span>
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={a.quellenhinweis ?? ""}
                      onChange={(e) => updateAufgabe(a.nr, { quellenhinweis: e.target.value })}
                    />
                  </label>
                </div>
              )}

              {a.typ === "bewegungsaufgabe" && (
                <label className="mb-3 block">
                  <span className={labelClass}>Vorzulesende Begriffe (eine Zeile pro Begriff)</span>
                  <textarea
                    className={inputClass}
                    rows={Math.max(3, (a.bewegungsElemente ?? []).length)}
                    value={(a.bewegungsElemente ?? []).join("\n")}
                    onChange={(e) => {
                      const bewegungsElemente = e.target.value
                        .split("\n")
                        .map((w) => w.trim())
                        .filter((w) => w.length > 0);
                      updateAufgabe(a.nr, { bewegungsElemente });
                    }}
                  />
                  <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                    Mischung aus passenden und nicht-passenden Begriffen - welche eine Reaktion
                    auslösen sollen, steht im Feld "Lösung" unten.
                  </span>
                </label>
              )}

              {a.typ === "sortierkarten" && (
                <div className="mb-3 space-y-2">
                  <label className="block">
                    <span className={labelClass}>Kategorien (durch Komma getrennt)</span>
                    <input
                      className={inputClass}
                      value={(a.sortierKategorien ?? []).join(", ")}
                      onChange={(e) => {
                        const sortierKategorien = e.target.value
                          .split(",")
                          .map((w) => w.trim())
                          .filter((w) => w.length > 0);
                        updateAufgabe(a.nr, { sortierKategorien });
                      }}
                    />
                  </label>
                  <span className={labelClass}>Ausschneide-Karten (Text und zugehörige Kategorie)</span>
                  {(a.sortierKarten ?? []).map((karte, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={`${inputClass} w-2/3`}
                        placeholder="Kartentext"
                        value={karte.text}
                        onChange={(e) => {
                          const sortierKarten = [...(a.sortierKarten ?? [])];
                          sortierKarten[i] = { ...sortierKarten[i], text: e.target.value };
                          updateAufgabe(a.nr, { sortierKarten });
                        }}
                      />
                      <input
                        className={`${inputClass} w-1/3`}
                        placeholder="Kategorie"
                        value={karte.kategorie}
                        onChange={(e) => {
                          const sortierKarten = [...(a.sortierKarten ?? [])];
                          sortierKarten[i] = { ...sortierKarten[i], kategorie: e.target.value };
                          updateAufgabe(a.nr, { sortierKarten });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {a.typ === "nachspuruebung" && (
                <label className="mb-3 block max-w-xs">
                  <span className={labelClass}>Wort/Phrase zum Nachfahren</span>
                  <input
                    className={inputClass}
                    value={a.nachspurText ?? ""}
                    onChange={(e) => updateAufgabe(a.nr, { nachspurText: e.target.value })}
                  />
                </label>
              )}

              <label className="block">
                <span className={labelClass}>Lösung</span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={loesungenByNr[a.nr] ?? ""}
                  onChange={(e) =>
                    setLoesungenByNr((l) => ({ ...l, [a.nr]: e.target.value }))
                  }
                />
              </label>
            </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        icon={BookMarked}
        title="Quellenangaben"
        action={<AddButton onClick={addQuelle}>Quelle hinzufügen</AddButton>}
      >
        <div className="space-y-3">
          {content.quellen.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Quelle {i + 1}
                </span>
                <RemoveButton onClick={() => removeQuelle(i)} />
              </div>
              <input
                className={`${inputClass} mb-2.5`}
                placeholder="Bezeichnung, z.B. Sahih al-Bukhari, ..."
                value={q.bezeichnung}
                onChange={(e) => updateQuelle(i, { bezeichnung: e.target.value })}
              />
              <input
                className={`${inputClass} mb-2.5`}
                placeholder="Zitat/Wortlaut (optional)"
                value={q.text ?? ""}
                onChange={(e) => updateQuelle(i, { text: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <span className="text-slate-600">Status:</span>
                <select
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                  value={q.sicherheit}
                  onChange={(e) =>
                    updateQuelle(i, { sicherheit: e.target.value as Quelle["sicherheit"] })
                  }
                >
                  <option value="gesichert">gesichert</option>
                  <option value="bitte_pruefen">bitte prüfen</option>
                </select>
              </label>
            </div>
          ))}
          {content.quellen.length === 0 && (
            <p className="text-sm text-slate-400">Keine Quellenangaben vorhanden.</p>
          )}
        </div>
      </SectionCard>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 font-medium text-white shadow-card transition hover:shadow-card-hover disabled:opacity-60"
        >
          <Save size={17} />
          {saving ? "Wird gespeichert …" : "Änderungen speichern"}
        </button>
        <a
          href={`/worksheet/${worksheetId}`}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300"
        >
          Abbrechen
        </a>
      </div>
    </form>
  );
}
