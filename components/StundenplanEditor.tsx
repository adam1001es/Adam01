"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Printer, Coffee } from "lucide-react";
import {
  WOCHENTAGE,
  nachWochentagGruppiert,
  type StundenplanEintragZeile,
} from "@/lib/stundenplan";
import { inputClass, labelClass } from "@/lib/formStyles";
import EinfacherLoeschButton from "./EinfacherLoeschButton";

interface FormWerte {
  wochentag: number;
  beginn: string;
  ende: string;
  schule: string;
  klasse: string;
  schuelerangabe: string;
  istPause: boolean;
}

function leereFormWerte(wochentag: number): FormWerte {
  return { wochentag, beginn: "", ende: "", schule: "", klasse: "", schuelerangabe: "", istPause: false };
}

/** Editor für den persönlichen Stundenplan (siehe app/werkzeuge/stundenplan) - eine Spalte je
 * Wochentag mit den Unterrichtseinheiten in Beginnzeit-Reihenfolge. Bewusst KEIN starres
 * Zeitraster über den ganzen Tag (mit Zeilenhöhe pro Minute o.ä.), da unterschiedliche Schulen
 * völlig unterschiedliche Anfangszeiten/Stundenlängen haben - die Karten werden einfach
 * chronologisch untereinander gestapelt, das bildet die Realität (mehrere Schulen mit
 * verschiedenen Rastern am selben Tag) robust ab, ohne krumme Pixelberechnungen. Samstag wird nur
 * angezeigt, wenn dafür bereits ein Eintrag existiert (die meisten Lehrkräfte brauchen ihn nicht,
 * manche höheren Schulen/Abendschulen in Österreich aber schon). */
export default function StundenplanEditor({ eintraege }: { eintraege: StundenplanEintragZeile[] }) {
  const router = useRouter();
  const gruppen = nachWochentagGruppiert(eintraege);
  const sichtbareTage = WOCHENTAGE.filter((t) => t.wert <= 5 || gruppen.has(t.wert));

  const [formFuer, setFormFuer] = useState<{ modus: "neu" | "bearbeiten"; id?: string } | null>(null);
  const [werte, setWerte] = useState<FormWerte>(leereFormWerte(1));
  const [isPending, setIsPending] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  function neuOeffnen(wochentag: number) {
    setWerte(leereFormWerte(wochentag));
    setFehler(null);
    setFormFuer({ modus: "neu" });
  }

  function bearbeitenOeffnen(eintrag: StundenplanEintragZeile) {
    setWerte({
      wochentag: eintrag.wochentag,
      beginn: eintrag.beginn,
      ende: eintrag.ende,
      schule: eintrag.schule ?? "",
      klasse: eintrag.klasse ?? "",
      schuelerangabe: eintrag.schuelerangabe ?? "",
      istPause: eintrag.istPause,
    });
    setFehler(null);
    setFormFuer({ modus: "bearbeiten", id: eintrag.id });
  }

  async function speichern() {
    if (!formFuer) return;
    setFehler(null);
    setIsPending(true);
    const url =
      formFuer.modus === "neu"
        ? "/api/werkzeuge/stundenplan"
        : `/api/werkzeuge/stundenplan/${formFuer.id}`;
    const res = await fetch(url, {
      method: formFuer.modus === "neu" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wochentag: werte.wochentag,
        beginn: werte.beginn,
        ende: werte.ende,
        schule: werte.istPause ? werte.schule || null : werte.schule,
        klasse: werte.istPause ? werte.klasse || null : werte.klasse,
        schuelerangabe: werte.schuelerangabe || null,
        istPause: werte.istPause,
      }),
    });
    setIsPending(false);
    if (res.ok) {
      setFormFuer(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setFehler(data.error ?? "Speichern fehlgeschlagen.");
    }
  }

  function eintragForm() {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50/40 p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={labelClass}>Beginn</span>
            <input
              type="time"
              value={werte.beginn}
              onChange={(e) => setWerte((w) => ({ ...w, beginn: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Ende</span>
            <input
              type="time"
              value={werte.ende}
              onChange={(e) => setWerte((w) => ({ ...w, ende: e.target.value }))}
              className={inputClass}
            />
          </label>
        </div>

        <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={werte.istPause}
            onChange={(e) => setWerte((w) => ({ ...w, istPause: e.target.checked }))}
            className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          Pause / Fahrtzeit (kein Unterricht)
        </label>

        {!werte.istPause && (
          <>
            <label className="mt-2 block">
              <span className={labelClass}>Schule</span>
              <input
                type="text"
                value={werte.schule}
                onChange={(e) => setWerte((w) => ({ ...w, schule: e.target.value }))}
                placeholder="z.B. VS Musterstraße"
                className={inputClass}
              />
            </label>
            <label className="mt-2 block">
              <span className={labelClass}>Klasse</span>
              <input
                type="text"
                value={werte.klasse}
                onChange={(e) => setWerte((w) => ({ ...w, klasse: e.target.value }))}
                placeholder="z.B. 3b"
                className={inputClass}
              />
            </label>
            <label className="mt-2 block">
              <span className={labelClass}>Schüler:innen (optional)</span>
              <input
                type="text"
                value={werte.schuelerangabe}
                onChange={(e) => setWerte((w) => ({ ...w, schuelerangabe: e.target.value }))}
                placeholder="z.B. 18 (10 m / 8 w)"
                className={inputClass}
              />
            </label>
          </>
        )}
        {werte.istPause && (
          <label className="mt-2 block">
            <span className={labelClass}>Hinweis (optional)</span>
            <input
              type="text"
              value={werte.schule}
              onChange={(e) => setWerte((w) => ({ ...w, schule: e.target.value }))}
              placeholder="z.B. Fahrtzeit zur nächsten Schule"
              className={inputClass}
            />
          </label>
        )}

        {fehler && <p className="mt-2 text-xs text-red-600">{fehler}</p>}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={speichern}
            disabled={isPending}
            className="rounded-lg bg-werkzeuge-gradient px-3 py-1.5 text-xs font-medium text-white shadow-sm disabled:opacity-60"
          >
            {isPending ? "…" : "Speichern"}
          </button>
          <button
            type="button"
            onClick={() => setFormFuer(null)}
            className="text-xs text-slate-500 hover:text-amber-700"
          >
            Abbrechen
          </button>
          {formFuer?.modus === "bearbeiten" && formFuer.id && (
            <span className="ml-auto">
              <EinfacherLoeschButton
                url={`/api/werkzeuge/stundenplan/${formFuer.id}`}
                bestaetigung="Diesen Stundenplan-Eintrag wirklich löschen?"
              />
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="no-print mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-surface px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-amber-300 hover:text-amber-700"
        >
          <Printer size={15} /> Drucken
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {sichtbareTage.map((tag) => {
          const tagesEintraege = gruppen.get(tag.wert) ?? [];
          return (
            <div key={tag.wert} className="min-w-[230px] flex-1">
              <h2 className="mb-2 font-display text-sm font-semibold text-slate-800">{tag.label}</h2>
              <div className="space-y-2">
                {tagesEintraege.map((eintrag) =>
                  formFuer?.modus === "bearbeiten" && formFuer.id === eintrag.id ? (
                    <div key={eintrag.id}>{eintragForm()}</div>
                  ) : (
                    <button
                      key={eintrag.id}
                      type="button"
                      onClick={() => bearbeitenOeffnen(eintrag)}
                      className={
                        "group block w-full rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card-werkzeuge " +
                        (eintrag.istPause
                          ? "border-slate-200 bg-slate-50/70"
                          : "border-amber-200 bg-surface")
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-amber-700">
                          {eintrag.beginn}–{eintrag.ende}
                        </span>
                        <Pencil
                          size={12}
                          className="text-slate-300 opacity-0 transition group-hover:opacity-100"
                        />
                      </div>
                      {eintrag.istPause ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Coffee size={12} /> {eintrag.schule || "Pause / Fahrtzeit"}
                        </p>
                      ) : (
                        <>
                          <p className="mt-1 text-sm font-medium text-slate-800">{eintrag.schule}</p>
                          <p className="text-xs text-slate-500">{eintrag.klasse}</p>
                          {eintrag.schuelerangabe && (
                            <p className="mt-0.5 text-xs text-slate-400">{eintrag.schuelerangabe}</p>
                          )}
                        </>
                      )}
                    </button>
                  ),
                )}

                {formFuer?.modus === "neu" && werte.wochentag === tag.wert ? (
                  eintragForm()
                ) : (
                  <button
                    type="button"
                    onClick={() => neuOeffnen(tag.wert)}
                    className="no-print flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-400 transition hover:border-amber-300 hover:text-amber-700"
                  >
                    <Plus size={13} /> Eintrag
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
