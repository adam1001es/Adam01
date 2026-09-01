"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileEdit, ListChecks, BookMarked, Plus, Trash2, Save } from "lucide-react";
import { WorksheetContent, Aufgabe, Quelle, BildergeschichteSchritt } from "@/lib/types";
import { ANFORDERUNGSBEREICHE, ANFORDERUNGSBEREICHE_KEYS, AnforderungsbereichKey } from "@/lib/curriculum";
import { ICON_KEYS, ICONS, IconKey, iconPfadWeb, generiertesBildPfadWeb } from "@/lib/icons";
import { erzeugeWortsucheGitter } from "@/lib/wortsuche";
import { erzeugeKreuzwortraetsel } from "@/lib/kreuzwortraetsel";
import SectionCard from "@/components/SectionCard";
import { inputClass, labelClass } from "@/lib/formStyles";

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
}: {
  worksheetId: string;
  initialContent: WorksheetContent;
}) {
  const router = useRouter();
  const [content, setContent] = useState<WorksheetContent>(initialContent);
  const [loesungenByNr, setLoesungenByNr] = useState<Record<number, string>>(
    Object.fromEntries(initialContent.loesungen.map((l) => [l.nr, l.loesung])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateAufgabe(nr: number, patch: Partial<Aufgabe>) {
    setContent((c) => ({
      ...c,
      aufgaben: c.aufgaben.map((a) => (a.nr === nr ? { ...a, ...patch } : a)),
    }));
  }

  function removeAufgabe(nr: number) {
    setContent((c) => ({ ...c, aufgaben: c.aufgaben.filter((a) => a.nr !== nr) }));
    setLoesungenByNr((l) => {
      const rest = { ...l };
      delete rest[nr];
      return rest;
    });
  }

  function addAufgabe() {
    const nr = naechsteNr(content.aufgaben);
    setContent((c) => ({
      ...c,
      aufgaben: [...c.aufgaben, { nr, typ: "offene_frage", frage: "" }],
    }));
    setLoesungenByNr((l) => ({ ...l, [nr]: "" }));
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
        body: JSON.stringify(finalContent),
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

      <SectionCard
        icon={ListChecks}
        title="Aufgaben & Lösungen"
        action={<AddButton onClick={addAufgabe}>Aufgabe hinzufügen</AddButton>}
      >
        <div className="space-y-5">
          {content.aufgaben.map((a) => (
            <div key={a.nr} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {a.nr}. {TYP_LABEL[a.typ]}
                </span>
                <RemoveButton onClick={() => removeAufgabe(a.nr)} />
              </div>
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
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
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
          ))}
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
