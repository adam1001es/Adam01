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
} from "./types";
import { buildCurriculumSystemContext } from "./curriculum";
import { prisma } from "./prisma";
import { beschaffeSicheresAusmalbild } from "./imageGen";
import { IconKey } from "./icons";

/** Neutrales, garantiert unbedenkliches Icon, auf das zurückgefallen wird, wenn ein per
 * Bild-KI generiertes Motiv die Sicherheitsprüfung nicht besteht oder die Generierung
 * technisch fehlschlägt - das Arbeitsblatt bekommt dann trotzdem ein Bild, nur eben dieses. */
const FALLBACK_ICON: IconKey = "stern";

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
    { "nr": number, "typ": "multiple_choice"|"lueckentext"|"zuordnung"|"offene_frage"|"wahr_falsch"|"ausmalbild"|"bildergeschichte", "frage": string, "optionen"?: string[], "zuordnungLinks"?: string[], "zuordnungRechts"?: string[], "wortliste"?: string[], "bild"?: string, "bildBeschreibung"?: string, "bildergeschichteSchritte"?: [{ "bild"?: string, "bildBeschreibung"?: string, "vorlesetext": string }], "anforderungsbereich": "afb1"|"afb2"|"afb3" }
  ],
  "loesungen": [ { "nr": number, "loesung": string } ],
  "quellen": [ { "bezeichnung": string, "text"?: string, "sicherheit": "gesichert"|"bitte_pruefen" } ]
}
Jede Aufgabe braucht eine passende Lösung mit gleicher "nr" UND ein Feld "anforderungsbereich" (siehe pädagogische Standards unten). Bei "zuordnung" müssen zuordnungLinks und zuordnungRechts gleich lang sein.
Bei "lueckentext" MUSS "wortliste" gesetzt sein: eine durcheinandergewürfelte Liste aus allen richtigen Lücken-Wörtern plus 1-2 plausiblen, aber falschen Ablenker-Wörtern, damit die Schüler:innen aus einer Wortliste auswählen können.
Die Typen "ausmalbild" und "bildergeschichte" sind bildbasierte Aufgaben für noch nicht lese-/schreibkundige Kinder (siehe Hinweis unten, falls zutreffend). Bei "bild"/"bildergeschichteSchritte" IMMER GENAU EINES von zwei Feldern setzen, nie beide: entweder "bild" mit einem der vorgegebenen Bild-Schlüssel, ODER "bildBeschreibung" mit einer kurzen deutschen Beschreibung eines neuen Motivs (wird per Bild-KI erzeugt). Diese Beschreibung MUSS eine vollständig eigenständige, kontextfreie Objekt-Beschreibung sein - so, als würde sie ohne jeden Bezug zum restlichen Arbeitsblatt an eine Bild-KI geschickt (z.B. "ein großer Fisch im Meer", NICHT "der Fisch, der den Propheten Yunus verschluckte"). Beschreibe AUSSCHLIESSLICH Gegenstände, Tiere, Pflanzen, Natur oder Gebäude. Erwähne in "bildBeschreibung" NIEMALS Menschen, Gesichter, Personen-Silhouetten, Namen oder Titel von Propheten (auch nicht implizit über die Geschichte, z.B. "Yunus", "Musa", "Prophet", "Gesandte"), Allah, Koran/Quran oder religiöse Symbole, die als Personendarstellung gelesen werden könnten - selbst wenn die eigentliche Aufgabe ("frage"/"vorlesetext") sich auf einen Propheten bezieht, bleibt "bildBeschreibung" rein objektbezogen und namenlos/kontextlos (solche Beschreibungen mit verbotenen Begriffen werden automatisch verworfen und die Aufgabe bekommt dann nur ein generisches Ersatzbild). Bei diesen beiden Typen kann "loesung" ein kurzer Hinweis für die Lehrkraft sein (z.B. "Kein Lösungswort - Kind malt frei aus.").
Jede verwendete Hadith-Quellenangabe MUSS die Sammlung im Feld "bezeichnung" nennen (z.B. "Sahih al-Bukhari, ...").`;

const VERIFICATION_SYSTEM_PROMPT_BASE = `Du bist eine unabhängige fachliche und pädagogische Prüferin für Arbeitsblätter im islamischen Religionsunterricht an österreichischen Schulen. Du bekommst ein fertig generiertes Arbeitsblatt als JSON und prüfst es kritisch:

1. Fachliche/theologische Plausibilität - wirken Koran-/Hadith-Angaben erfunden oder unsicher? Passt die Darstellung zu einer mehrheitsfähigen, für den staatlichen Unterricht geeigneten Position (Sunnah)?
2. Hadith-Quellen: stammen alle genannten Hadithe erkennbar aus Sahih al-Bukhari, Sahih Muslim oder einer anderen allgemein als sahih geltenden Sammlung? Wenn eine Quelle fehlt, unklar oder zweifelhaft ist, IMMER als Hinweis aufnehmen.
3. Lehrplan-/Altersgerechtigkeit: passt Thema, Komplexität und Themenbereich zum mitgelieferten Schulstufen-Cluster und Themenbereich?
4. Vollständigkeit: hat jede Aufgabe eine Lösung? Sind Zuordnungen konsistent (gleiche Länge links/rechts)? Hat jede Lückentext-Aufgabe eine passende Wortliste (enthält das richtige Lösungswort plus 1-2 Ablenker)?
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
    max_tokens: 8000,
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

  const rawContent = extractJson(getTextFromMessage(genResponse));
  const content = WorksheetContentSchema.parse(rawContent);
  await loeseGenerierteBilderAuf(content);

  const verifyResponse = await client.messages.create({
    model: VERIFICATION_MODEL,
    max_tokens: 4000,
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
 * Löst jedes von Claude vorgeschlagene "bildBeschreibung"-Motiv live auf: generiert ein Bild,
 * lässt es sicherheitsprüfen (siehe lib/imageGen.ts) und speichert es bei Erfolg persistent
 * (GeneratedImage) - bei Fehlschlag oder nicht bestandener Prüfung wird stattdessen ein festes,
 * garantiert unbedenkliches Icon aus der kuratierten Bibliothek verwendet. Mutiert `content`.
 */
async function loeseGenerierteBilderAuf(content: WorksheetContent): Promise<void> {
  for (const aufgabe of content.aufgaben) {
    if (aufgabe.bildBeschreibung && !aufgabe.bild) {
      await loeseBildFeldAuf(aufgabe, aufgabe.bildBeschreibung);
    }
    if (aufgabe.bildergeschichteSchritte) {
      for (const schritt of aufgabe.bildergeschichteSchritte) {
        if (schritt.bildBeschreibung && !schritt.bild) {
          await loeseBildFeldAuf(schritt, schritt.bildBeschreibung);
        }
      }
    }
  }
}

/** Mutiert `ziel` (eine Aufgabe oder ein Bildergeschichte-Schritt): bei erfolgreicher,
 * sicherheitsgeprüfter Generierung wird "bildGeneriertId" gesetzt, sonst fällt "bild" auf ein
 * festes, garantiert unbedenkliches Icon zurück. */
async function loeseBildFeldAuf(
  ziel: { bild?: IconKey; bildGeneriertId?: string },
  motivBeschreibung: string,
): Promise<void> {
  const bild = await beschaffeSicheresAusmalbild(motivBeschreibung);
  if (bild) {
    const gespeichert = await prisma.generatedImage.create({ data: { data: bild } });
    ziel.bildGeneriertId = gespeichert.id;
  } else {
    ziel.bild = FALLBACK_ICON;
  }
}
