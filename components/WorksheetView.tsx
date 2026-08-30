import { WorksheetContent, LayoutConfig, Aufgabe } from "@/lib/types";
import { THEMENBEREICHE, ThemenbereichKey, ANFORDERUNGSBEREICHE } from "@/lib/curriculum";
import { formatDoppelDatum } from "@/lib/hijri";
import { ICONS, IconKey, iconPfadWeb, generiertesBildPfadWeb } from "@/lib/icons";
import { zuordnungAnzeige } from "@/lib/zuordnung";
import IslamicPatternStrip from "./IslamicPatternStrip";

const TYP_LABEL: Record<Aufgabe["typ"], string> = {
  multiple_choice: "Multiple Choice",
  lueckentext: "Lückentext",
  zuordnung: "Zuordnung",
  offene_frage: "Offene Frage",
  wahr_falsch: "Wahr oder Falsch",
  ausmalbild: "Ausmalbild",
  bildergeschichte: "Bildergeschichte",
};

/** Zeigt entweder ein festes Icon aus der kuratierten Bibliothek oder ein live per Bild-KI
 * generiertes, sicherheitsgeprüftes Motiv (siehe lib/imageGen.ts) - genau eines der beiden ist
 * gesetzt. */
function AufgabenBild({
  bild,
  bildGeneriertId,
  hoehe,
}: {
  bild?: IconKey;
  bildGeneriertId?: string;
  hoehe: number;
}) {
  if (bildGeneriertId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={generiertesBildPfadWeb(bildGeneriertId)}
        alt="Ausmalbild-Motiv"
        style={{ height: hoehe, width: "auto" }}
      />
    );
  }
  if (bild) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={iconPfadWeb(bild)} alt={ICONS[bild].label} style={{ height: hoehe, width: "auto" }} />
    );
  }
  return null;
}

export default function WorksheetView({
  content,
  layout,
  themenbereich,
  erstelltAm,
}: {
  content: WorksheetContent;
  layout: LayoutConfig;
  themenbereich: ThemenbereichKey;
  erstelltAm: Date;
}) {
  const istSchwarzweiss = layout.farbmodus === "schwarzweiss";
  const isModern = layout.template === "modern";
  const isKompakt = layout.template === "kompakt";
  // Bei Schwarz-Weiß-Druck macht der farbige "modern"-Kopfbereich keinen Sinn (viel Toner/Tinte,
  // im Graustil oft schwer lesbar) - dann immer die schlichte, umrandete Kopfzeile.
  const isModernFarbig = isModern && !istSchwarzweiss;
  const fontClass = isModern || isKompakt ? "font-sans" : "font-serif";
  const textSize = layout.schriftgroesse === "gross" ? "text-lg" : "text-base";
  const spacing = isKompakt ? "space-y-3" : "space-y-5";
  const akzentKlasse = isModernFarbig ? "text-brand-700" : "";

  return (
    <div className={`relative rounded-2xl border border-slate-200 bg-white p-6 shadow-card print:border-0 print:shadow-none ${fontClass} ${textSize}`}>
      <div
        className={
          isModernFarbig
            ? "-mx-6 -mt-6 mb-5 rounded-t-2xl bg-brand-gradient px-6 py-4 text-white"
            : "mb-5 border-b-2 border-slate-900 pb-3"
        }
      >
        {layout.schulname && (
          <div className={`text-sm ${isModernFarbig ? "text-brand-50" : "text-slate-500"}`}>
            {layout.schulname}
          </div>
        )}
        <h1 className="text-2xl font-bold">{content.titel}</h1>
        <div className={`text-sm ${isModernFarbig ? "text-brand-50" : "text-slate-600"}`}>
          {content.fach} · {content.schulstufe} · Thema: {content.thema}
        </div>
        <div className={`mt-1 text-xs ${isModernFarbig ? "text-brand-50/80" : "text-slate-400"}`}>
          Themenbereich: {THEMENBEREICHE[themenbereich].label}
          {layout.zeigeIslamischesDatum && <> · {formatDoppelDatum(erstelltAm)}</>}
        </div>
      </div>

      {layout.zeigeMuster && (
        <div className="mb-4">
          <IslamicPatternStrip variante={layout.musterVariante} hoehe={28} />
        </div>
      )}

      <div className="mb-5 text-sm text-slate-500">
        Name: _______________________&nbsp;&nbsp;&nbsp; Klasse: __________
        {!layout.zeigeIslamischesDatum && <>&nbsp;&nbsp;&nbsp; Datum: __________</>}
      </div>

      <div className={spacing}>
        {layout.zeigeLernziel && (
          <div>
            <h2 className={`mb-1 font-semibold ${isModernFarbig ? "text-brand-700" : ""}`}>Lernziel</h2>
            <p>{content.lernziel}</p>
          </div>
        )}
        <div>
          <h2 className={`mb-1 font-semibold ${isModernFarbig ? "text-brand-700" : ""}`}>Einleitung</h2>
          <p>{content.einleitung}</p>
        </div>
        <div>
          <h2 className={`mb-2 font-semibold ${isModernFarbig ? "text-brand-700" : ""}`}>Aufgaben</h2>
          <ol className={spacing}>
            {content.aufgaben.map((a) => (
              <li key={a.nr}>
                <div className="mb-0.5 text-xs uppercase tracking-wide text-slate-400">
                  {TYP_LABEL[a.typ]}
                  {a.anforderungsbereich && ` · ${ANFORDERUNGSBEREICHE[a.anforderungsbereich].label}`}
                </div>
                <div className="font-medium">
                  {a.nr}. {a.frage}
                </div>
                {a.typ === "multiple_choice" && a.optionen && (
                  <ul className="ml-5 mt-1 list-[lower-alpha] space-y-0.5">
                    {a.optionen.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                )}
                {a.typ === "zuordnung" && zuordnungAnzeige(a) && (
                  <div className="ml-5 mt-1.5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    <div className="space-y-1">
                      {zuordnungAnzeige(a)!.links.map((l) => (
                        <div key={l.nummer} className="flex items-baseline gap-2">
                          <span className="w-6 shrink-0 rounded border border-slate-300 text-center text-xs">
                            &nbsp;
                          </span>
                          <span className="w-5 shrink-0">{l.nummer}.</span>
                          <span>{l.text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 text-slate-600">
                      {zuordnungAnzeige(a)!.rechts.map((r) => (
                        <div key={r.buchstabe}>
                          <span className="font-medium">{r.buchstabe})</span> {r.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {a.typ === "lueckentext" && a.wortliste && a.wortliste.length > 0 && (
                  <div className="ml-5 mt-1 text-sm text-slate-600">
                    <span className="font-medium">Wortliste: </span>
                    {a.wortliste.join(" · ")}
                  </div>
                )}
                {a.typ === "ausmalbild" && (a.bild || a.bildGeneriertId) && (
                  <div className="mt-2 flex justify-center">
                    <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6">
                      <AufgabenBild bild={a.bild} bildGeneriertId={a.bildGeneriertId} hoehe={140} />
                    </div>
                  </div>
                )}
                {a.typ === "bildergeschichte" && a.bildergeschichteSchritte && (
                  <div className="mt-2 flex flex-wrap justify-center gap-4">
                    {a.bildergeschichteSchritte.map((schritt, i) => (
                      <div key={i} className="flex w-28 flex-col items-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                          <AufgabenBild bild={schritt.bild} bildGeneriertId={schritt.bildGeneriertId} hoehe={60} />
                        </div>
                        <p className="mt-1 text-xs italic text-slate-500">{schritt.vorlesetext}</p>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        {!layout.loesungenSeparat && <LoesungenBlock content={content} isModernFarbig={isModernFarbig} />}

        {content.quellen.length > 0 && (
          <div>
            <h2 className={`mb-2 font-semibold ${isModernFarbig ? "text-brand-700" : ""}`}>
              Quellenangaben
            </h2>
            <ul className="space-y-1 text-sm">
              {content.quellen.map((q, i) => (
                <li key={i}>
                  {q.bezeichnung}
                  {q.text ? ` — „${q.text}“` : ""}
                  {q.sicherheit === "bitte_pruefen" && (
                    <span className="no-print ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                      bitte prüfen
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="no-print mt-6 border-t border-slate-200 pt-3 text-xs text-slate-500">
        Automatisch erstellter Inhalt. Religiöse Quellenangaben (Koran/Hadith) bitte vor dem
        Einsatz im Unterricht fachlich gegenprüfen.
      </p>

      {layout.loesungenSeparat && (
        <div className="mt-8 border-t-2 border-dashed border-slate-300 pt-6">
          <h2 className={`mb-2 text-lg font-semibold ${isModernFarbig ? "text-brand-700" : ""}`}>
            {content.titel} — Lösungsblatt
          </h2>
          <LoesungenBlock content={content} isModernFarbig={isModernFarbig} />
        </div>
      )}
    </div>
  );
}

function LoesungenBlock({
  content,
  isModernFarbig,
}: {
  content: WorksheetContent;
  isModernFarbig: boolean;
}) {
  return (
    <div>
      <h2 className={`mb-2 font-semibold ${isModernFarbig ? "text-brand-700" : ""}`}>Lösungen</h2>
      <ol className="space-y-1">
        {content.loesungen.map((l) => (
          <li key={l.nr}>
            {l.nr}. {l.loesung}
          </li>
        ))}
      </ol>
    </div>
  );
}
