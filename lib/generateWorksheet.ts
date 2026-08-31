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
  BILDERGESCHICHTE_SCHRITTE_MAXIMUM,
} from "./types";
import { buildCurriculumSystemContext } from "./curriculum";
import { prisma } from "./prisma";
import { beschaffeSicheresAusmalbild } from "./imageGen";
import { IconKey, ICON_KEYS } from "./icons";
import { erzeugeWortsucheGitter } from "./wortsuche";
import { erzeugeKreuzwortraetsel } from "./kreuzwortraetsel";

/** Reihenfolge, in der auf feste Icons zurückgefallen wird, wenn ein per Bild-KI generiertes
 * Motiv die Sicherheitsprüfung nicht besteht oder die Generierung technisch fehlschlägt.
 * Bewusst KEIN einzelnes festes Icon mehr (früher immer "stern") - bei mehreren Bild-Aufgaben
 * auf demselben Arbeitsblatt (z.B. wenn Bildgenerierung insgesamt gerade nicht funktioniert)
 * sah es sonst so aus, als wäre exakt dasselbe Bild vervielfacht worden. */
const FALLBACK_ICON_REIHENFOLGE: IconKey[] = [
  "stern",
  "halbmond",
  "sonne",
  "laterne",
  "moschee",
  "wassertropfen",
  "teppich",
  "herz",
  "buch",
  "familie",
];

/** Grobe Stichwort-Zuordnung, damit der Fallback bei einer inhaltlich passenden Motiv-
 * Beschreibung (z.B. "Sterne am Nachthimmel" bei Ibrahim) nicht rein zufällig, sondern
 * thematisch treffend gewählt wird, bevor auf die generische Reihenfolge zurückgefallen wird. */
const FALLBACK_ICON_STICHWORTE: [RegExp, IconKey][] = [
  [/mond/i, "halbmond"],
  [/stern/i, "stern"],
  [/moschee/i, "moschee"],
  [/(laterne|lampe|licht)/i, "laterne"],
  [/herz/i, "herz"],
  [/(buch|schrift)/i, "buch"],
  [/sonne/i, "sonne"],
  [/(wasser|tropfen|meer|fluss|regen|see)/i, "wassertropfen"],
  [/(familie|eltern|kinder)/i, "familie"],
  [/(teppich|gebet)/i, "teppich"],
];

/** Wählt ein Fallback-Icon: zuerst thematisch passend zur Motiv-Beschreibung (falls noch nicht
 * auf diesem Arbeitsblatt verwendet), sonst das nächste noch unbenutzte Icon aus der festen
 * Reihenfolge, damit mehrere Fallback-Bilder auf demselben Blatt möglichst unterschiedlich
 * ausfallen statt alle identisch zu sein. */
function waehleFallbackIcon(motivBeschreibung: string, bereitsVerwendet: Set<IconKey>): IconKey {
  for (const [muster, icon] of FALLBACK_ICON_STICHWORTE) {
    if (muster.test(motivBeschreibung) && !bereitsVerwendet.has(icon)) return icon;
  }
  const unbenutzt = FALLBACK_ICON_REIHENFOLGE.find((icon) => !bereitsVerwendet.has(icon));
  if (unbenutzt) return unbenutzt;
  return ICON_KEYS[bereitsVerwendet.size % ICON_KEYS.length];
}

const GENERATION_SYSTEM_PROMPT_BASE = `Du bist eine erfahrene Fachdidaktikerin für den islamischen Religionsunterricht an Schulen in Österreich (staatlich anerkannter konfessioneller Unterricht, Lehrpläne der IGGÖ gem. BGBl. II Nr. 234/2011). Du erstellst didaktisch hochwertige, altersgerechte, lehrplankonforme Arbeitsblätter.

Wichtige Regeln für religiöse Inhalte:
- Vertrete eine mehrheitsfähige, in Österreich für den schulischen Unterricht gängige sunnitische Grundposition (Sunnah); vermeide sektiererische oder kontroverse Einzelmeinungen.
- Sei bei Koran- und Hadith-Zitaten sehr vorsichtig: Erfinde niemals Sure- und Vers-Nummern oder Hadith-Nummern, wenn du dir nicht absolut sicher bist. Gib im Zweifel nur eine sinngemäße Wiedergabe ohne genaue Stellenangabe an und markiere die Quelle als "bitte_pruefen". Nur bei absolut eindeutigen, allgemein bekannten Stellen (z.B. Sure Al-Fatiha als Ganzes, das Schahada) darfst du "gesichert" verwenden - und auch dann nur den bekannten Grundtext, keine erfundenen Detailangaben.
- Inhalte müssen altersgerecht für die angegebene Schulstufe sein (Wortwahl, Komplexität, Aufgabenlänge).
- Verwende durchgehend "Allah" statt "Gott" (z.B. "Allahs Barmherzigkeit" statt "Gottes Barmherzigkeit", "an Allah glauben" statt "an Gott glauben", "Allah der Erhabene" statt "Gott der Erhabene") - grammatikalisch korrekt eingebaut, nicht nur ersetzt.
- Antworte ausschließlich auf Deutsch.
- Antworte NUR mit einem einzigen JSON-Objekt, ohne Markdown-Codeblock, ohne Erklärtext davor oder danach.

Das JSON-Objekt muss exakt diese Struktur haben:
{
  "titel": string,
  "fach": string,
  "schulstufe": string,
  "thema": string,
  "lernziel": string,
  "einleitung": string,
  "aufgaben": [
    { "nr": number, "typ": "multiple_choice"|"lueckentext"|"zuordnung"|"offene_frage"|"wahr_falsch"|"ausmalbild"|"bildergeschichte"|"reihenfolge"|"lesetext"|"diskussion"|"wortsuche"|"kreuzwortraetsel", "frage": string, "optionen"?: string[], "zuordnungLinks"?: string[], "zuordnungRechts"?: string[], "wortliste"?: string[], "bild"?: string, "bildBeschreibung"?: string, "bildergeschichteSchritte"?: [{ "bild"?: string, "bildBeschreibung"?: string, "vorlesetext": string }], "reihenfolgeElemente"?: string[], "lesetext"?: string, "wortsucheWoerter"?: string[], "kreuzwortEintraege"?: [{ "frage": string, "antwort": string }], "anforderungsbereich": "afb1"|"afb2"|"afb3" }
  ],
  "loesungen": [ { "nr": number, "loesung": string } ],
  "quellen": [ { "bezeichnung": string, "text"?: string, "sicherheit": "gesichert"|"bitte_pruefen" } ]
}
Jede Aufgabe braucht eine passende Lösung mit gleicher "nr" UND ein Feld "anforderungsbereich" (siehe pädagogische Standards unten). Bei "zuordnung" müssen zuordnungLinks und zuordnungRechts gleich lang sein.
Bei "lueckentext" MUSS "wortliste" gesetzt sein: eine durcheinandergewürfelte Liste aus allen richtigen Lücken-Wörtern plus 1-2 plausiblen, aber falschen Ablenker-Wörtern, damit die Schüler:innen aus einer Wortliste auswählen können.
Die Typen "ausmalbild" und "bildergeschichte" sind bildbasierte Aufgaben für noch nicht lese-/schreibkundige Kinder (siehe Hinweis unten, falls zutreffend). Bei "bild"/"bildergeschichteSchritte" IMMER GENAU EINES von zwei Feldern setzen, nie beide: entweder "bild" mit einem der vorgegebenen Bild-Schlüssel, ODER "bildBeschreibung" mit einer kurzen deutschen Beschreibung eines neuen Motivs (wird per Bild-KI erzeugt). WICHTIG zur Wahl zwischen beiden: die zehn festen Bild-Schlüssel (Halbmond, Stern, Moschee, Laterne, Herz, Buch, Sonne, Wassertropfen, Familie, Gebetsteppich) sind bewusst allgemein/generisch gehalten - nutze "bild" NUR, wenn eines davon die Szene tatsächlich konkret trifft (z.B. ein Gebetsteppich bei einer Aufgabe übers Beten). Bei "bildergeschichte" hat JEDER Schritt eine eigene, story-spezifische Szene (z.B. "ein Korb treibt auf dem Fluss", "ein Palast", "Feuer auf einem Berg bei Nacht") - hier IMMER "bildBeschreibung" mit einem neuen, zur jeweiligen Szene passenden Motiv verwenden, NIE ersatzweise auf ein nur vage passendes festes Icon ausweichen (ein Wassertropfen oder Halbmond illustriert die eigentliche Szene kaum). Diese Beschreibung MUSS eine vollständig eigenständige, kontextfreie Objekt-Beschreibung sein - so, als würde sie ohne jeden Bezug zum restlichen Arbeitsblatt an eine Bild-KI geschickt (z.B. "ein großer Fisch im Meer", NICHT "der Fisch, der den Propheten Yunus verschluckte"). Beschreibe AUSSCHLIESSLICH Gegenstände, Tiere, Pflanzen, Natur oder Gebäude. Erwähne in "bildBeschreibung" NIEMALS Menschen, Gesichter, Personen-Silhouetten, Namen oder Titel von Propheten (auch nicht implizit über die Geschichte, z.B. "Yunus", "Musa", "Prophet", "Gesandte"), Allah, Koran/Quran oder religiöse Symbole, die als Personendarstellung gelesen werden könnten - selbst wenn die eigentliche Aufgabe ("frage"/"vorlesetext") sich auf einen Propheten bezieht, bleibt "bildBeschreibung" rein objektbezogen und namenlos/kontextlos (solche Beschreibungen mit verbotenen Begriffen werden automatisch verworfen und die Aufgabe bekommt dann nur ein generisches Ersatzbild). Bei diesen beiden Typen kann "loesung" ein kurzer Hinweis für die Lehrkraft sein (z.B. "Kein Lösungswort - Kind malt frei aus.").
Bei "reihenfolge" MUSS "reihenfolgeElemente" gesetzt sein: 3-6 kurze Ereignisse/Schritte in der RICHTIGEN chronologischen bzw. logischen Reihenfolge (das System mischt sie selbst für den Druck - du musst dich nicht um eine "zufällige" Anordnung kümmern, liefere sie einfach korrekt geordnet). "frage" ist die Arbeitsanweisung (z.B. "Bringe die Ereignisse in die richtige Reihenfolge, indem du die Zahlen 1-4 daneben einträgst."). "loesung" nennt die korrekte Reihenfolge in Klartext (z.B. "1. ..., 2. ..., 3. ...").
Bei "lesetext" MUSS "lesetext" gesetzt sein: ein kurzer, altersgerechter Lesetext (ca. 3-6 Sätze) zum Thema; "frage" ist eine Verständnisfrage, die sich konkret auf diesen Text bezieht (nicht auf Allgemeinwissen). Nur für Schulstufen einsetzen, die schon selbstständig lesen können (nicht bei 1./2. Klasse Volksschule, siehe Hinweis unten, falls zutreffend).
Bei "diskussion" ist "frage" der Diskussionsimpuls für ein mündliches Unterrichtsgespräch (kein schriftliches Ergebnis erwartet); "loesung" ist ein kurzer Hinweis für die Lehrkraft mit möglichen Gesprächsaspekten (z.B. "Mögliche Aspekte: ..., ...").
Bei "wortsuche" MUSS "wortsucheWoerter" gesetzt sein: 4-8 kurze, thematisch passende Wörter in GROSSBUCHSTABEN (nur A-Z, keine Umlaute/ß/Leerzeichen/Bindestriche - schreibe z.B. "MOSCHEE" statt "Gebetsstätte", "SCHAHADA" statt "Schahāda"). Das System erzeugt daraus automatisch ein Buchstabengitter zum Suchen - liefere KEIN Gitter, nur die Wortliste. "frage" ist die Arbeitsanweisung (z.B. "Finde die folgenden Wörter im Buchstabengitter.").
Bei "kreuzwortraetsel" MUSS "kreuzwortEintraege" gesetzt sein: 5-8 Objekte { "frage": kurze Umschreibung/Hinweis, "antwort": Lösungswort in GROSSBUCHSTABEN (nur A-Z, keine Umlaute/ß/Leerzeichen, z.B. "MOSCHEE" statt "Gebetsstätte") }. Wähle nach Möglichkeit Wörter mit gemeinsamen Buchstaben, damit sich ein zusammenhängendes Rätsel ergibt. Das System erzeugt daraus automatisch das nummerierte Gitter - liefere KEIN Gitter. Das Top-Level-Feld "frage" der Aufgabe ist die allgemeine Arbeitsanweisung (z.B. "Löse das Kreuzworträtsel mithilfe der Hinweise.").
Wichtige Ausnahme bei der "Anzahl Aufgaben": "bildergeschichte", "kreuzwortraetsel" und "wortsuche" sind für sich genommen schon umfangreich (mehrere Bild-Schritte bzw. 4-8 Wörter samt Gitter) - erstelle von JEDEM dieser drei Typen HÖCHSTENS 1 Aufgabe pro Arbeitsblatt, egal wie hoch "Anzahl Aufgaben" ist oder ob nur ein solcher Typ erlaubt ist. Bei "bildergeschichte" zusätzlich HÖCHSTENS 5 Schritte (nicht mehr, auch wenn die Geschichte länger wäre - kürze sinnvoll). "ausmalbild" ist auf HÖCHSTENS 4 Aufgaben pro Arbeitsblatt begrenzt (jedes weitere Ausmalbild bedeutet ein zusätzliches, per Bild-KI generiertes Bild - das ist ein reines Kosten-Limit, kein inhaltlicher Grund). Ist die angeforderte Gesamtzahl mit den erlaubten Typen unter diesen Grenzen nicht erreichbar (z.B. nur "kreuzwortraetsel" erlaubt und Anzahl Aufgaben > 1, oder nur "ausmalbild" erlaubt und Anzahl Aufgaben > 4), erstelle trotzdem nur so viele Aufgaben wie hier erlaubt - ein Arbeitsblatt mit weniger Aufgaben als angefordert ist hier ausdrücklich in Ordnung, die Grenzen selbst NICHT überschreiten.
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
8. Falls "ausmalbild"/"bildergeschichte"-Aufgaben enthalten sind: sind "frage" bzw. "vorlesetext" wirklich sehr kurz und einfach formuliert (vorlesbar für noch nicht lesekundige Kinder)? Falls die Schulstufe 1./2. Klasse Volksschule ist, aber trotzdem überwiegend textlastige Aufgabentypen verwendet wurden, als Hinweis/Fehler aufnehmen.

Sei besonders streng bei allen Quellenangaben mit "sicherheit": "gesichert" - wenn du dir nicht sicher bist, ob die Stelle korrekt ist, stufe sie im Hinweis als fragwürdig ein.

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

/** Erzwingt BILDERGESCHICHTE_SCHRITTE_MAXIMUM serverseitig: die Systemprompt-Anweisung
 * "3-5 Schritte" ist nur eine Empfehlung, kein hartes Zod-Limit (ein hartes Zod-Limit hätte
 * die ganze Antwort als ungültig verworfen statt nur überzählige Schritte zu kappen). Schneidet
 * überzählige Schritte einfach ab, statt die Generierung abzubrechen. */
export function begrenzeBildergeschichteSchritte(content: WorksheetContent): void {
  for (const aufgabe of content.aufgaben) {
    if (
      aufgabe.bildergeschichteSchritte &&
      aufgabe.bildergeschichteSchritte.length > BILDERGESCHICHTE_SCHRITTE_MAXIMUM
    ) {
      aufgabe.bildergeschichteSchritte = aufgabe.bildergeschichteSchritte.slice(
        0,
        BILDERGESCHICHTE_SCHRITTE_MAXIMUM,
      );
    }
  }
}

function buildUserPrompt(req: GenerateRequest): string {
  return `Erstelle ein Arbeitsblatt mit folgenden Vorgaben:
- Bereich/Fach: ${req.bereich}
- Thema: ${req.thema}
- Schulstufe: ${req.schulstufe}
- Anzahl Aufgaben: ${req.anzahlAufgaben}
- Erlaubte Aufgabentypen (mische sinnvoll): ${req.aufgabentypen.join(", ")}
${req.zusatzhinweise ? `- Zusätzliche Hinweise der Lehrkraft: ${req.zusatzhinweise}` : ""}`;
}

export interface GenerationResult {
  content: WorksheetContent;
  verification: Verification;
}

export async function generateAndVerifyWorksheet(
  req: GenerateRequest,
): Promise<GenerationResult> {
  const client = getAnthropicClient();

  const curriculumContext = buildCurriculumSystemContext(req.themenbereich, req.schulstufe);

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
    messages: [{ role: "user", content: buildUserPrompt(req) }],
  });

  if (genResponse.stop_reason === "max_tokens") {
    throw new Error(
      "Die Antwort des Modells wurde wegen zu vieler Aufgaben/Inhalte abgeschnitten. Bitte weniger Aufgaben oder weniger Aufgabentypen gleichzeitig anfordern.",
    );
  }
  const rawContent = extractJson(getTextFromMessage(genResponse));
  const content = WorksheetContentSchema.parse(rawContent);
  begrenzeAufgabenProTyp(content);
  begrenzeBildergeschichteSchritte(content);
  // Gitter-Auflösung (schnell, synchron, rein lokal) VOR der Verifikation, damit die
  // Kreuzworträtsel-Lösung dort schon final/korrekt nummeriert vorliegt. Die Bildgenerierung
  // dagegen (potenziell mehrere Sekunden pro Bild) läuft PARALLEL zum Verifikations-Aufruf statt
  // danach - beides braucht nur den bereits vorliegenden Text-Inhalt, nicht das jeweils andere
  // Ergebnis. Das verkürzt die Gesamtlaufzeit spürbar und hilft, das Zeitlimit der
  // /api/generate-Route einzuhalten.
  loeseRaetselAuf(content);

  const [, verifyResponse] = await Promise.all([
    loeseGenerierteBilderAuf(content),
    client.messages.create({
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
    }),
  ]);

  const rawVerification = extractJson(getTextFromMessage(verifyResponse));
  const verification = VerificationSchema.parse(rawVerification);

  return { content, verification };
}

/**
 * Löst jedes von Claude vorgeschlagene "bildBeschreibung"-Motiv live auf: generiert ein Bild,
 * lässt es sicherheitsprüfen (siehe lib/imageGen.ts) und speichert es bei Erfolg persistent
 * (GeneratedImage) - bei Fehlschlag oder nicht bestandener Prüfung wird stattdessen ein festes,
 * garantiert unbedenkliches Icon aus der kuratierten Bibliothek verwendet. Mutiert `content`.
 */
export async function loeseGenerierteBilderAuf(content: WorksheetContent): Promise<void> {
  const verwendeteFallbackIcons = new Set<IconKey>();
  // Alle Bild-Aufrufe parallel statt nacheinander: jede Generierung + Sicherheitsprüfung dauert
  // mehrere Sekunden, bei z.B. 4-6 Bildern in einer Bildergeschichte summierte sich das
  // nacheinander leicht auf über eine Minute und riss das serverseitige Zeitlimit (Vercel
  // maxDuration) - der Browser zeigt das als generischen Netzwerkfehler ("Load failed").
  // waehleFallbackIcon()/verwendeteFallbackIcons.add() bleiben dabei sicher: der jeweilige
  // Zugriff erfolgt synchron direkt nach dem Warten auf die einzelne Bildgenerierung, ohne
  // weiteren "await" dazwischen - andere parallele Aufrufe können hier nicht dazwischenfunken.
  const generierungen: Promise<void>[] = [];
  for (const aufgabe of content.aufgaben) {
    if (aufgabe.bildBeschreibung && !aufgabe.bild) {
      generierungen.push(loeseBildFeldAuf(aufgabe, aufgabe.bildBeschreibung, verwendeteFallbackIcons));
    }
    if (aufgabe.bildergeschichteSchritte) {
      for (const schritt of aufgabe.bildergeschichteSchritte) {
        if (schritt.bildBeschreibung && !schritt.bild) {
          generierungen.push(loeseBildFeldAuf(schritt, schritt.bildBeschreibung, verwendeteFallbackIcons));
        }
      }
    }
  }
  await Promise.all(generierungen);
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

/** Mutiert `ziel` (eine Aufgabe oder ein Bildergeschichte-Schritt): bei erfolgreicher,
 * sicherheitsgeprüfter Generierung wird "bildGeneriertId" gesetzt, sonst fällt "bild" auf ein
 * festes, garantiert unbedenkliches Icon zurück - möglichst eines, das auf diesem Arbeitsblatt
 * noch nicht als Fallback verwendet wurde (siehe waehleFallbackIcon). */
async function loeseBildFeldAuf(
  ziel: { bild?: IconKey; bildGeneriertId?: string },
  motivBeschreibung: string,
  verwendeteFallbackIcons: Set<IconKey>,
): Promise<void> {
  const bild = await beschaffeSicheresAusmalbild(motivBeschreibung);
  if (bild) {
    const gespeichert = await prisma.generatedImage.create({ data: { data: bild } });
    ziel.bildGeneriertId = gespeichert.id;
  } else {
    const fallbackIcon = waehleFallbackIcon(motivBeschreibung, verwendeteFallbackIcons);
    ziel.bild = fallbackIcon;
    verwendeteFallbackIcons.add(fallbackIcon);
  }
}
