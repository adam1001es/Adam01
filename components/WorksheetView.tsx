import { WorksheetContent, LayoutConfig, Aufgabe } from "@/lib/types";

const TYP_LABEL: Record<Aufgabe["typ"], string> = {
  multiple_choice: "Multiple Choice",
  lueckentext: "Lückentext",
  zuordnung: "Zuordnung",
  offene_frage: "Offene Frage",
  wahr_falsch: "Wahr oder Falsch",
};

export default function WorksheetView({
  content,
  layout,
}: {
  content: WorksheetContent;
  layout: LayoutConfig;
}) {
  const isModern = layout.template === "modern";
  const isKompakt = layout.template === "kompakt";
  const fontClass = isModern || isKompakt ? "font-sans" : "font-serif";
  const textSize = layout.schriftgroesse === "gross" ? "text-lg" : "text-base";
  const spacing = isKompakt ? "space-y-3" : "space-y-5";

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none ${fontClass} ${textSize}`}>
      <div
        className={
          isModern
            ? "-mx-6 -mt-6 mb-5 rounded-t-lg bg-brand-600 px-6 py-4 text-white"
            : "mb-5 border-b-2 border-slate-900 pb-3"
        }
      >
        {layout.schulname && (
          <div className={`text-sm ${isModern ? "text-brand-50" : "text-slate-500"}`}>
            {layout.schulname}
          </div>
        )}
        <h1 className="text-2xl font-bold">{content.titel}</h1>
        <div className={`text-sm ${isModern ? "text-brand-50" : "text-slate-600"}`}>
          {content.fach} · {content.schulstufe} · Thema: {content.thema}
        </div>
      </div>

      <div className="mb-5 text-sm text-slate-500">
        Name: _______________________&nbsp;&nbsp;&nbsp; Klasse: __________&nbsp;&nbsp;&nbsp; Datum: __________
      </div>

      <div className={spacing}>
        <div>
          <h2 className={`mb-1 font-semibold ${isModern ? "text-brand-700" : ""}`}>Lernziel</h2>
          <p>{content.lernziel}</p>
        </div>
        <div>
          <h2 className={`mb-1 font-semibold ${isModern ? "text-brand-700" : ""}`}>Einleitung</h2>
          <p>{content.einleitung}</p>
        </div>
        <div>
          <h2 className={`mb-2 font-semibold ${isModern ? "text-brand-700" : ""}`}>Aufgaben</h2>
          <ol className={spacing}>
            {content.aufgaben.map((a) => (
              <li key={a.nr}>
                <div className="mb-0.5 text-xs uppercase tracking-wide text-slate-400">
                  {TYP_LABEL[a.typ]}
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
                {a.typ === "zuordnung" && a.zuordnungLinks && (
                  <div className="ml-5 mt-1 space-y-0.5">
                    {a.zuordnungLinks.map((left, i) => (
                      <div key={i} className="flex justify-between gap-4 sm:w-1/2">
                        <span>{left}</span>
                        <span className="text-slate-400">↔</span>
                        <span>{a.zuordnungRechts?.[i]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        {!layout.loesungenSeparat && <LoesungenBlock content={content} isModern={isModern} />}

        {content.quellen.length > 0 && (
          <div>
            <h2 className={`mb-2 font-semibold ${isModern ? "text-brand-700" : ""}`}>
              Quellenangaben
            </h2>
            <ul className="space-y-1 text-sm">
              {content.quellen.map((q, i) => (
                <li key={i}>
                  {q.bezeichnung}
                  {q.text ? ` — „${q.text}“` : ""}
                  {q.sicherheit === "bitte_pruefen" && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                      bitte prüfen
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="mt-6 border-t border-slate-200 pt-3 text-xs text-slate-500">
        Automatisch erstellter Inhalt. Religiöse Quellenangaben (Koran/Hadith) bitte vor dem
        Einsatz im Unterricht fachlich gegenprüfen.
      </p>

      {layout.loesungenSeparat && (
        <div className="mt-8 border-t-2 border-dashed border-slate-300 pt-6">
          <h2 className={`mb-2 text-lg font-semibold ${isModern ? "text-brand-700" : ""}`}>
            {content.titel} — Lösungsblatt
          </h2>
          <LoesungenBlock content={content} isModern={isModern} />
        </div>
      )}
    </div>
  );
}

function LoesungenBlock({
  content,
  isModern,
}: {
  content: WorksheetContent;
  isModern: boolean;
}) {
  return (
    <div>
      <h2 className={`mb-2 font-semibold ${isModern ? "text-brand-700" : ""}`}>Lösungen</h2>
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
