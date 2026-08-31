import {
  getAnthropicClient,
  GENERATION_MODEL,
  VERIFICATION_MODEL,
  extractJson,
  getTextFromMessage,
} from "./anthropic";
import {
  GenerateRequest,
  WorksheetContent,
  WorksheetContentSchema,
  Verification,
  VerificationSchema,
  AUFGABEN_TYP_MAXIMUM,
  KOMPLEXITAET_LABEL,
  schaetzeAufgabenAnzahl,
} from "./types";
import { buildCurriculumSystemContext } from "./curriculum";
import { erzeugeWortsucheGitter } from "./wortsuche";
import { erzeugeKreuzwortraetsel } from "./kreuzwortraetsel";

const GENERATION_SYSTEM_PROMPT_BASE = `Du bist eine erfahrene Fachdidaktikerin für den islamischen Religionsunterricht an Schulen in Österreich (staatlich anerkannter konfessioneller Unterricht, Lehrpläne der IGGÖ gem. BGBl. II Nr. 234/2011). Du erstellst didaktisch hochwertige, altersgerechte, lehrplankonforme Arbeitsblätter.

Wichtige Regeln für religiöse Inhalte:
- Vertrete eine mehrheitsfähige, in Österreich für den schulischen Unterricht gängige sunnitische Grundposition (Sunnah); vermeide sektiererische oder kontroverse Einzelmeinungen.
- Sei bei Koran- und Hadith-Zitaten sehr vorsichtig: Erfinde niemals Sure- und Vers-Nummern oder Hadith-Nummern, wenn du dir nicht absolut sicher bist. Gib im Zweifel nur eine sinngemäße Wiedergabe ohne genaue Stellenangabe an und markiere die Quelle als "bitte_pruefen". Nur bei absolut eindeutigen, allgemein bekannten Stellen (z.B. Sure Al-Fatiha als Ganzes, das Schahada) darfst du "gesichert" verwenden - und auch dann nur den bekannten Grundtext, keine erfundenen Detailangaben.
- Inhalte müssen altersgerecht für die angegebene Schulstufe sein (Wortwahl, Komplexität, Aufgabenlänge).
- Verwende durchgehend "Allah" statt "Gott" (z.B. "Allahs Barmherzigkeit" statt "Gottes Barmherzigkeit", "an Allah glauben" statt "an Gott glauben", "Allah der Erhabene" statt "Gott der Erhabene") - grammatikalisch korrekt eingebaut, nicht nur ersetzt.
- Antworte ausschließlich auf Deutsch.
- Antworte NUR mit einem einzigen JSON-Objekt, ohne Markdown-Codeblock, ohne Erklärtext davor oder danach.

Qualitätsanspruch - kein 08/15-Arbeitsblatt: Jede Aufgabe muss erkennbar aus dem KONKRETEN Thema heraus entwickelt sein, nicht x-beliebig gegen ein anderes Thema derselben Grundkompetenz austauschbar. Vermeide austauschbare Floskeln, generische Lehrbuch-Standardsätze und Alibi-Antworten wie "individuelle Antwort" ohne echten Denkanstoß (Ausnahme: bei "diskussion" und wirklich offenen Fragen ist eine kurze Hinweis-Antwort statt einer "Musterlösung" sachlich korrekt - dort zählt das nicht als Floskel). Nutze wo passend konkrete Details aus dem Thema selbst (Namen, Orte, Situationen) statt vager Verallgemeinerungen. "einleitung" und "lernziel" sollen erkennen lassen, WORUM es in diesem spezifischen Arbeitsblatt geht, nicht nur allgemein um "den Islam" oder "die Religion".
Bei bekannten, häufig behandelten Themen (z.B. "Die 5 Säulen", "Die Propheten", Ramadan) greifen viele Lehrkräfte auf dieselbe naheliegende Standardversion zurück - wähle deshalb bewusst NICHT automatisch das offensichtlichste Beispiel/den erstbesten Aufhänger, sondern such dir (fachlich weiterhin korrekt und altersgerecht) einen von mehreren plausiblen Blickwinkeln, Beispielen oder Aufgabenideen aus, damit zwei Arbeitsblätter zum selben Thema sich erkennbar unterscheiden können, statt beide auf die eine "Musterversion" zu konvergieren.

Das JSON-Objekt muss exakt diese Struktur haben:
{
  "titel": string,
  "fach": string,
  "schulstufe": string,
  "thema": string,
  "lernziel": string,
  "einleitung": string,
  "aufgaben": [
    { "nr": number, "typ": "multiple_choice"|"lueckentext"|"zuordnung"|"offene_frage"|"wahr_falsch"|"reihenfolge"|"lesetext"|"diskussion"|"wortsuche"|"kreuzwortraetsel", "frage": string, "optionen"?: string[], "zuordnungLinks"?: string[], "zuordnungRechts"?: string[], "wortliste"?: string[], "reihenfolgeElemente"?: string[], "lesetext"?: string, "wortsucheWoerter"?: string[], "kreuzwortEintraege"?: [{ "frage": string, "antwort": string }], "anforderungsbereich": "afb1"|"afb2"|"afb3" }
  ],
  "loesungen": [ { "nr": number, "loesung": string } ],
  "quellen": [ { "bezeichnung": string, "text"?: string, "sicherheit": "gesichert"|"bitte_pruefen" } ]
}
Jede Aufgabe braucht eine passende Lösung mit gleicher "nr" UND ein Feld "anforderungsbereich" (siehe pädagogische Standards unten). Bei "zuordnung" müssen zuordnungLinks und zuordnungRechts gleich lang sein.
Bei "lueckentext" MUSS "wortliste" gesetzt sein: eine durcheinandergewürfelte Liste aus allen richtigen Lücken-Wörtern plus 1-2 plausiblen, aber falschen Ablenker-Wörtern, damit die Schüler:innen aus einer Wortliste auswählen können.
Bei "reihenfolge" MUSS "reihenfolgeElemente" gesetzt sein: 3-6 kurze Ereignisse/Schritte in der RICHTIGEN chronologischen bzw. logischen Reihenfolge (das System mischt sie selbst für den Druck - du musst dich nicht um eine "zufällige" Anordnung kümmern, liefere sie einfach korrekt geordnet). "frage" ist die Arbeitsanweisung (z.B. "Bringe die Ereignisse in die richtige Reihenfolge, indem du die Zahlen 1-4 daneben einträgst."). "loesung" nennt die korrekte Reihenfolge in Klartext (z.B. "1. ..., 2. ..., 3. ...").
Bei "lesetext" MUSS "lesetext" gesetzt sein: ein kurzer, altersgerechter Lesetext (ca. 3-6 Sätze) zum Thema; "frage" ist eine Verständnisfrage, die sich konkret auf diesen Text bezieht (nicht auf Allgemeinwissen). Nur für Schulstufen einsetzen, die schon selbstständig lesen können (nicht bei 1./2. Klasse Volksschule, siehe Hinweis unten, falls zutreffend).
Bei "diskussion" ist "frage" der Diskussionsimpuls für ein mündliches Unterrichtsgespräch (kein schriftliches Ergebnis erwartet); "loesung" ist ein kurzer Hinweis für die Lehrkraft mit möglichen Gesprächsaspekten (z.B. "Mögliche Aspekte: ..., ...").
Bei "wortsuche" MUSS "wortsucheWoerter" gesetzt sein: 4-8 kurze, thematisch passende Wörter in GROSSBUCHSTABEN (nur A-Z, keine Umlaute/ß/Leerzeichen/Bindestriche - schreibe z.B. "MOSCHEE" statt "Gebetsstätte", "SCHAHADA" statt "Schahāda"). Das System erzeugt daraus automatisch ein Buchstabengitter zum Suchen - liefere KEIN Gitter, nur die Wortliste. "frage" ist die Arbeitsanweisung (z.B. "Finde die folgenden Wörter im Buchstabengitter.").
Bei "kreuzwortraetsel" MUSS "kreuzwortEintraege" gesetzt sein: 5-8 Objekte { "frage": kurze Umschreibung/Hinweis, "antwort": Lösungswort in GROSSBUCHSTABEN (nur A-Z, keine Umlaute/ß/Leerzeichen, z.B. "MOSCHEE" statt "Gebetsstätte") }. Wähle nach Möglichkeit Wörter mit gemeinsamen Buchstaben, damit sich ein zusammenhängendes Rätsel ergibt. Das System erzeugt daraus automatisch das nummerierte Gitter - liefere KEIN Gitter. Das Top-Level-Feld "frage" der Aufgabe ist die allgemeine Arbeitsanweisung (z.B. "Löse das Kreuzworträtsel mithilfe der Hinweise.").
Wichtige Ausnahme bei der "Anzahl Aufgaben": "kreuzwortraetsel" und "wortsuche" sind für sich genommen schon umfangreich (4-8 Wörter samt Gitter) - erstelle von JEDEM dieser beiden Typen HÖCHSTENS 1 Aufgabe pro Arbeitsblatt, egal wie hoch "Anzahl Aufgaben" ist oder ob nur ein solcher Typ erlaubt ist. Ist die angeforderte Gesamtzahl mit den erlaubten Typen unter dieser Grenze nicht erreichbar (z.B. nur "kreuzwortraetsel" erlaubt und Anzahl Aufgaben > 1), erstelle trotzdem nur so viele Aufgaben wie hier erlaubt - ein Arbeitsblatt mit weniger Aufgaben als angefordert ist hier ausdrücklich in Ordnung, die Grenze selbst NICHT überschreiten.
Jede verwendete Hadith-Quellenangabe MUSS die Sammlung im Feld "bezeichnung" nennen (z.B. "Sahih al-Bukhari, ...").`;

const VERIFICATION_SYSTEM_PROMPT_BASE = `Du bist eine unabhängige fachliche und pädagogische Prüferin für Arbeitsblätter im islamischen Religionsunterricht an österreichischen Schulen. Du bekommst ein fertig generiertes Arbeitsblatt als JSON und prüfst es kritisch:

1. Fachliche/theologische Plausibilität - wirken Koran-/Hadith-Angaben erfunden oder unsicher? Passt die Darstellung zu einer mehrheitsfähigen, für den staatlichen Unterricht geeigneten Position (Sunnah)?
2. Hadith-Quellen: stammen alle genannten Hadithe erkennbar aus Sahih al-Bukhari, Sahih Muslim oder einer anderen allgemein als sahih geltenden Sammlung? Wenn eine Quelle fehlt, unklar oder zweifelhaft ist, IMMER als Hinweis aufnehmen.
3. Lehrplan-/Altersgerechtigkeit: passt Thema, Komplexität und Themenbereich zum mitgelieferten Schulstufen-Cluster und Themenbereich?
4. Vollständigkeit: hat jede Aufgabe eine Lösung? Sind Zuordnungen konsistent (gleiche Länge links/rechts)? Hat jede Lückentext-Aufgabe eine passende Wortliste (enthält das richtige Lösungswort plus 1-2 Ablenker)? Hat jede "reihenfolge"-Aufgabe mindestens 3 Elemente in einer nachvollziehbar korrekten Reihenfolge? Bezieht sich bei "lesetext" die Frage tatsächlich auf den mitgelieferten Text? Hat "wortsuche" mindestens 4 thematisch passende, in GROSSBUCHSTABEN ohne Umlaute/ß geschriebene Wörter? Hat "kreuzwortraetsel" mindestens 4 Einträge mit passenden Hinweisen und Antworten in GROSSBUCHSTABEN ohne Umlaute/ß?
5. Sprachliche Korrektheit (Deutsch) und Sprachsensibilität (klare, altersgerechte Sätze, Fachbegriffe erklärt statt vorausgesetzt).
6. Neutralität/Eignung für konfessionellen Unterricht (keine kontroversen politischen Aussagen, keine Herabsetzung anderer Religionen/Gruppen).
6b. Terminologie: Wird durchgehend "Allah" statt "Gott" verwendet, grammatikalisch korrekt? Falls "Gott" irrtümlich vorkommt, als Hinweis aufnehmen.
7. Kompetenzorientierung: Sind die "anforderungsbereich"-Angaben (afb1/afb2/afb3) plausibel und passt die Verteilung zur Schulstufe (nicht nur AFB I bei älteren Schulstufen)? Ist das Lernziel kompetenzorientiert/operationalisiert formuliert (passendes Verb zum höchsten Anforderungsbereich)?
8. Konkretheit statt 08/15: Könnten mehrere Aufgaben eins zu eins auch für ein völlig anderes Thema stehen (austauschbare Floskeln statt konkretem Bezug zum angegebenen Thema)? Ist "einleitung"/"lernziel" nur vage allgemein ("der Islam ist wichtig" o.ä.) statt konkret auf DIESES Thema bezogen? Das zählt als eigenständiger Mangel, unabhängig von fachlicher Korrektheit - stufe ein Arbeitsblatt, das überwiegend aus austauschbaren Standardformulierungen ohne erkennbaren Bezug zum konkreten Thema besteht, als "fehler" ein (nicht nur "warnung"); einzelne wenig konkrete Stellen reichen für "warnung".

Sei besonders streng bei allen Quellenangaben mit "sicherheit": "gesichert" - wenn du dir nicht sicher bist, ob die Stelle korrekt ist, stufe sie im Hinweis als fragwürdig ein.

WICHTIG zur Formulierung von "zusammenfassung" und "hinweise" (an die Lehrkraft ausgeliefert - siehe VerificationBanner in der App): Schreibe wie eine externe Fachkollegin, die das fertige Arbeitsblatt inhaltlich gegenliest, NIEMALS wie eine Erklärung der eigenen Prüfmethodik. Nenne dabei NIE die internen Bezeichner aus diesem Prompt oder dem JSON-Schema wörtlich (z.B. niemals "afb1"/"afb2"/"afb3", "anforderungsbereich", "gesichert"/"bitte_pruefen" als Begriffe) - beschreibe stattdessen inhaltlich in normaler pädagogischer Sprache (z.B. "die Aufgabe verlangt mehr als reines Nennen" statt "das ist eher afb2"). Kommentiere NIEMALS, warum/wie eine Kennzeichnung im Arbeitsblatt selbst zustande kam (z.B. NICHT "die Kennzeichnung als 'bitte_pruefen' ist nachvollziehbar/verantwortungsvoll") - sag stattdessen direkt und knapp, was zu tun ist (z.B. "Diese Quelle vor dem Einsatz gegenchecken: Sure X, Vers Y"). Jeder Hinweis soll wie normales, konkretes Feedback zum Inhalt klingen, nie wie eine Beschreibung des Prüfsystems selbst.

Antworte NUR mit einem einzigen JSON-Objekt, ohne Markdown-Codeblock:
{
  "status": "ok" | "warnung" | "fehler",
  "zusammenfassung": string,
  "hinweise": string[]
}
- "ok": keine relevanten Probleme.
- "warnung": nutzbar, aber es gibt Punkte, die eine Lehrkraft vor Einsatz prüfen sollte (z.B. Quellenangaben gegenchecken).
- "fehler": das Arbeitsblatt sollte vor Verwendung überarbeitet werden (z.B. offensichtlich falsche/erfundene Zitate, Hadithe aus unbekannter/zweifelhafter Quelle, fehlende Lösungen, unpassende Altersstufe).
Liste in "hinweise" konkrete, konstruktive Punkte auf (auch bei "ok" ruhig ein bis zwei Hinweise, z.B. "Sure X vor Verwendung gegenchecken").`;

/** Erzwingt AUFGABEN_TYP_MAXIMUM serverseitig, unabhängig davon, ob sich Claude an die
 * entsprechende Anweisung im System-Prompt gehalten hat: entfernt überzählige Aufgaben der
 * gedeckelten Typen (behält die jeweils ersten) und nummeriert Aufgaben/Lösungen danach lückenlos
 * neu durch. */
export function begrenzeAufgabenProTyp(content: WorksheetContent): void {
  const anzahlProTyp = new Map<string, number>();
  const behalteneAufgaben = content.aufgaben.filter((aufgabe) => {
    const maximum = AUFGABEN_TYP_MAXIMUM[aufgabe.typ];
    if (maximum === undefined) return true;
    const bisher = anzahlProTyp.get(aufgabe.typ) ?? 0;
    if (bisher >= maximum) return false;
    anzahlProTyp.set(aufgabe.typ, bisher + 1);
    return true;
  });

  const alteZuNeueNr = new Map<number, number>();
  behalteneAufgaben.forEach((aufgabe, i) => {
    alteZuNeueNr.set(aufgabe.nr, i + 1);
    aufgabe.nr = i + 1;
  });

  content.aufgaben = behalteneAufgaben;
  content.loesungen = content.loesungen
    .filter((loesung) => alteZuNeueNr.has(loesung.nr))
    .map((loesung) => ({ ...loesung, nr: alteZuNeueNr.get(loesung.nr)! }));
}

function buildUserPrompt(
  req: GenerateRequest,
  anzahlAufgaben: number,
  korrekturAuftrag?: Verification,
): string {
  const korrekturBlock = korrekturAuftrag
    ? `\n\nWICHTIG - Korrekturauftrag: Ein vorheriger Versuch für dieses Arbeitsblatt wurde bei der Qualitätsprüfung als "fehler" eingestuft. Erstelle das Arbeitsblatt neu und behebe dabei GEZIELT diese konkreten Probleme (beim Rest darfst du dich frei orientieren, nicht stur am alten Versuch festhalten):\n${korrekturAuftrag.hinweise.map((h) => `- ${h}`).join("\n")}\nZusammenfassung der vorherigen Prüfung: ${korrekturAuftrag.zusammenfassung}`
    : "";

  return `Erstelle ein Arbeitsblatt mit folgenden Vorgaben:
- Bereich/Fach: ${req.bereich}
- Thema: ${req.thema}
- Schulstufe: ${req.schulstufe}
- Zieldauer für die Bearbeitung im Unterricht: ${req.zieldauerMinuten} Minuten (Richtwert, keine exakte Messung möglich)
- Komplexität: ${KOMPLEXITAET_LABEL[req.komplexitaet]}
- Anzahl Aufgaben (aus der Zieldauer abgeleiteter Richtwert - Ziel ist, die Zieldauer zu treffen, nicht exakt diese Zahl): ${anzahlAufgaben}
- Erlaubte Aufgabentypen (mische sinnvoll): ${req.aufgabentypen.join(", ")}
${req.zusatzhinweise ? `- Zusätzliche Hinweise der Lehrkraft: ${req.zusatzhinweise}` : ""}${korrekturBlock}`;
}

export interface GenerationResult {
  content: WorksheetContent;
  verification: Verification;
}

export async function generateAndVerifyWorksheet(
  req: GenerateRequest,
): Promise<GenerationResult> {
  const curriculumContext = buildCurriculumSystemContext(req.themenbereich, req.schulstufe, req.komplexitaet);
  const anzahlAufgaben = schaetzeAufgabenAnzahl(req.zieldauerMinuten, req.aufgabentypen, req.komplexitaet);

  const ersterVersuch = await generiereUndPruefeEinmal(req, curriculumContext, anzahlAufgaben);

  // Automatischer zweiter Versuch NUR bei "fehler" (ein von der Prüfung erkannter echter Mangel) -
  // NICHT bei "warnung" (das Blatt ist nutzbar, nur mit Hinweisen zum Gegenchecken). Die konkrete
  // Kritik aus der ersten Prüfung wird als Korrekturauftrag mitgegeben, damit der zweite Versuch
  // gezielt das Problem behebt statt blind neu zu würfeln. Ohne diesen zweiten Versuch würde ein
  // von der eigenen Prüfung als fehlerhaft erkanntes Arbeitsblatt bisher trotzdem unverändert an
  // die Lehrkraft ausgeliefert (nur mit Status "verworfen" im Hintergrund).
  if (ersterVersuch.verification.status !== "fehler") return ersterVersuch;
  return generiereUndPruefeEinmal(req, curriculumContext, anzahlAufgaben, ersterVersuch.verification);
}

async function generiereUndPruefeEinmal(
  req: GenerateRequest,
  curriculumContext: string,
  anzahlAufgaben: number,
  korrekturAuftrag?: Verification,
): Promise<GenerationResult> {
  const client = getAnthropicClient();

  const genResponse = await client.messages.create({
    model: GENERATION_MODEL,
    // 16000 statt 8000: bei mehreren inhaltsreichen Aufgaben (zb 3x Kreuzworträtsel mit je
    // 5-8 Hinweis/Antwort-Paaren) reichte das alte Limit nicht, die Antwort wurde mitten im
    // JSON abgeschnitten ("Keine JSON-Struktur in der Modellantwort gefunden").
    max_tokens: 16000,
    // GENERATION_SYSTEM_PROMPT_BASE ist bei jeder Anfrage byte-identisch (großer, statischer
    // Block) - als eigener, gecachter Prefix-Block ausgelagert. curriculumContext variiert pro
    // Anfrage (Themenbereich/Schulstufe) und steht daher NACH dem Cache-Breakpoint, damit er den
    // Cache-Treffer auf den statischen Block nicht zunichtemacht (Cache = Prefix-Match).
    system: [
      {
        type: "text",
        text: GENERATION_SYSTEM_PROMPT_BASE,
        cache_control: { type: "ephemeral", ttl: "1h" },
      },
      { type: "text", text: curriculumContext },
    ],
    messages: [{ role: "user", content: buildUserPrompt(req, anzahlAufgaben, korrekturAuftrag) }],
  });

  if (genResponse.stop_reason === "max_tokens") {
    throw new Error(
      "Die Antwort des Modells wurde wegen zu vieler Aufgaben/Inhalte abgeschnitten. Bitte weniger Aufgaben oder weniger Aufgabentypen gleichzeitig anfordern.",
    );
  }
  const rawContent = extractJson(getTextFromMessage(genResponse));
  const content = WorksheetContentSchema.parse(rawContent);
  begrenzeAufgabenProTyp(content);
  // Gitter-Auflösung (schnell, synchron, rein lokal) VOR der Verifikation, damit die
  // Kreuzworträtsel-Lösung dort schon final/korrekt nummeriert vorliegt.
  loeseRaetselAuf(content);

  const verifyResponse = await client.messages.create({
    model: VERIFICATION_MODEL,
    // Ebenfalls angehoben (war 4000): die Prüfantwort muss zum vollständigen, ggf. sehr
    // umfangreichen Arbeitsblatt-JSON passen und darf dabei nicht abgeschnitten werden.
    max_tokens: 8000,
    system: [
      {
        type: "text",
        text: VERIFICATION_SYSTEM_PROMPT_BASE,
        cache_control: { type: "ephemeral", ttl: "1h" },
      },
      { type: "text", text: curriculumContext },
    ],
    messages: [
      {
        role: "user",
        content: `Prüfe dieses Arbeitsblatt-JSON:\n\n${JSON.stringify(content, null, 2)}`,
      },
    ],
  });

  const rawVerification = extractJson(getTextFromMessage(verifyResponse));
  const verification = VerificationSchema.parse(rawVerification);

  return { content, verification };
}

/**
 * Löst "wortsuche"- und "kreuzwortraetsel"-Aufgaben auf: Claude liefert nur die Wörter bzw.
 * Hinweis/Antwort-Paare, das eigentliche Gitter-Layout wird deterministisch serverseitig
 * berechnet (siehe lib/wortsuche.ts, lib/kreuzwortraetsel.ts - ein Sprachmodell kann kein
 * überschneidungsfreies Gitter zuverlässig von Hand layouten). Mutiert `content`.
 *
 * Bei "kreuzwortraetsel" wird zusätzlich die zugehörige "loesung" (in content.loesungen) mit
 * einem programmatisch erzeugten Text überschrieben: Claude kennt beim Schreiben der Lösung die
 * endgültige Nummerierung des Gitters noch nicht (die erst hier entsteht), eine von Claude selbst
 * geschriebene nummerierte Lösung wäre also potenziell falsch.
 */
export function loeseRaetselAuf(content: WorksheetContent): void {
  for (const aufgabe of content.aufgaben) {
    if (aufgabe.typ === "wortsuche" && aufgabe.wortsucheWoerter) {
      const ergebnis = erzeugeWortsucheGitter(aufgabe.wortsucheWoerter);
      if (ergebnis) {
        aufgabe.wortsucheGitter = ergebnis.gitter;
        aufgabe.wortsucheWoerter = ergebnis.platzierteWoerter;
      }
    }
    if (aufgabe.typ === "kreuzwortraetsel" && aufgabe.kreuzwortEintraege) {
      const ergebnis = erzeugeKreuzwortraetsel(aufgabe.kreuzwortEintraege);
      if (ergebnis) {
        aufgabe.kreuzwortGitter = ergebnis.gitter;
        aufgabe.kreuzwortWaagerecht = ergebnis.waagerecht;
        aufgabe.kreuzwortSenkrecht = ergebnis.senkrecht;
        const loesungText = [
          ...ergebnis.waagerecht.map((w) => `${w.nummer}. Waagerecht: ${w.antwort}`),
          ...ergebnis.senkrecht.map((w) => `${w.nummer}. Senkrecht: ${w.antwort}`),
        ].join(", ");
        const loesungEintrag = content.loesungen.find((l) => l.nr === aufgabe.nr);
        if (loesungEintrag) loesungEintrag.loesung = loesungText;
      }
    }
  }
}
