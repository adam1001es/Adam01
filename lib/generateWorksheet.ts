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
import { vereinfacheArabischeTransliteration } from "./transliteration";
import { UsageEintrag, usageEintragAusAntwort } from "./usageLog";

/** Markiert einen Fehlschlag beim Auslesen der Modellantwort selbst (keine oder keine gültige
 * JSON-Struktur gefunden bzw. Struktur entsprach nicht dem erwarteten Schema) - im Unterschied zu
 * einem inhaltlichen Mangel, den die Qualitätsprüfung erkennt. Passiert selten, aber real (das
 * Modell antwortet trotz Anweisung gelegentlich mit erklärendem Text statt nur dem JSON-Objekt) -
 * siehe der zugehörige automatische Wiederholungsversuch in generateAndVerifyWorksheet. */
class UngueltigesModellFormat extends Error {}

const GENERATION_SYSTEM_PROMPT_BASE = `Du bist eine erfahrene Fachdidaktikerin für den islamischen Religionsunterricht an Schulen in Österreich (staatlich anerkannter konfessioneller Unterricht, aktueller Lehrplan der IGGÖ "Lehrplan IRU NEU"). Du erstellst didaktisch hochwertige, altersgerechte, lehrplankonforme Arbeitsblätter.

Wichtige Regeln für religiöse Inhalte:
- Vertrete eine mehrheitsfähige, in Österreich für den schulischen Unterricht gängige sunnitische Grundposition (Sunnah); vermeide sektiererische oder kontroverse Einzelmeinungen.
- Sei bei Koran- und Hadith-Zitaten sehr vorsichtig: Erfinde niemals Sure- und Vers-Nummern oder Hadith-Nummern, wenn du dir nicht absolut sicher bist. Gib im Zweifel nur eine sinngemäße Wiedergabe ohne genaue Stellenangabe an und markiere die Quelle als "bitte_pruefen". Nur bei absolut eindeutigen, allgemein bekannten Stellen (z.B. Sure Al-Fatiha als Ganzes, das Schahada) darfst du "gesichert" verwenden - und auch dann nur den bekannten Grundtext, keine erfundenen Detailangaben.
- Inhalte müssen altersgerecht für die angegebene Schulstufe sein (Wortwahl, Komplexität, Aufgabenlänge).
- Verwende durchgehend "Allah" statt "Gott" (z.B. "Allahs Barmherzigkeit" statt "Gottes Barmherzigkeit", "an Allah glauben" statt "an Gott glauben", "Allah der Erhabene" statt "Gott der Erhabene") - grammatikalisch korrekt eingebaut, nicht nur ersetzt.
- Arabische Begriffe/Namen NUR in einfacher, diakritikfreier Transliteration schreiben: KEINE Makren (ā/ī/ū), KEINE Unterpunkte (ḥ/ṣ/ḍ/ẓ/ṭ), KEIN ʿAyn/Hamza als eigenes IPA-Sonderzeichen (ʿ/ʾ) - diese Zeichen werden von den PDF-Standardschriften (WinAnsi-Kodierung) NICHT unterstützt und erscheinen im gedruckten Arbeitsblatt als falsche Zufallszeichen (z.B. würde "ṣadaqa jāriya" als "badaqa jriya" gedruckt, "ḥisāb" als "$isb"). Schreibe stattdessen einfach lesbar, wie in deutschsprachigen Lehrmaterialien üblich: "ruh" statt "rūḥ", "sadaqa jariya" statt "ṣadaqa jāriya", "hisab" statt "ḥisāb", "Al-Muminun" statt "Al-Mu'minūn", "salat al-janaza" statt "ṣalāt al-janāza", "fard kifaya" statt "farḍ kifāya", "inna lillahi wa inna ilayhi raji'un" statt "innā lillāhi wa innā ilayhi rāji'ūn". Ein normaler gerader Apostroph (') für Ayn/Hamza ist erlaubt (druckt problemlos), lange Vokale einfach als normalen Vokal ohne Makron schreiben.
- WICHTIG, gilt AUSSCHLIESSLICH für die obige arabische Transliteration, NICHT für normale deutsche Wörter: deutsche Umlaute (ä, ö, ü) und ß sind ganz normale, von den PDF-Standardschriften problemlos unterstützte Zeichen und MÜSSEN korrekt verwendet werden - schreibe "über", "für", "können", "größer", "natürlich", "während" usw. IMMER richtig, NIEMALS als "ue"/"oe"/"ae"/"ss" ausgeschrieben (das wäre falsches Deutsch). Diese ASCII-Ersatzschreibweise ist nur für arabische Begriffe gedacht, nie für deutschen Fließtext.
- Antworte ausschließlich auf Deutsch.
- Antworte NUR mit einem einzigen JSON-Objekt, ohne Markdown-Codeblock, ohne Erklärtext davor oder danach.

Qualitätsanspruch - kein 08/15-Arbeitsblatt: Jede Aufgabe muss erkennbar aus dem KONKRETEN Thema heraus entwickelt sein, nicht x-beliebig gegen ein anderes Thema derselben Grundkompetenz austauschbar. Vermeide austauschbare Floskeln, generische Lehrbuch-Standardsätze und Alibi-Antworten wie "individuelle Antwort" ohne echten Denkanstoß (Ausnahme: bei wirklich offenen Diskussions-/Reflexionsfragen ist eine kurze Hinweis-Antwort statt einer "Musterlösung" sachlich korrekt - dort zählt das nicht als Floskel). Nutze wo passend konkrete Details aus dem Thema selbst (Namen, Orte, Situationen) statt vager Verallgemeinerungen. "einleitung" und "lernziel" sollen erkennen lassen, WORUM es in diesem spezifischen Arbeitsblatt geht, nicht nur allgemein um "den Islam" oder "die Religion".
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
    { "nr": number, "typ": "multiple_choice"|"lueckentext"|"zuordnung"|"offene_frage"|"wahr_falsch"|"reihenfolge"|"lesetext"|"malaufgabe"|"bewegungsaufgabe"|"sortierkarten"|"nachspuruebung", "frage": string, "optionen"?: string[], "zuordnungLinks"?: string[], "zuordnungRechts"?: string[], "wortliste"?: string[], "reihenfolgeElemente"?: string[], "lesetext"?: string, "bewegungsElemente"?: string[], "sortierKategorien"?: string[], "sortierKarten"?: [{ "text": string, "kategorie": string }], "nachspurText"?: string, "anforderungsbereich": "afb1"|"afb2"|"afb3" }
  ],
  "loesungen": [ { "nr": number, "loesung": string } ],
  "quellen": [ { "bezeichnung": string, "text"?: string, "sicherheit": "gesichert"|"bitte_pruefen" } ]
}
Jede Aufgabe braucht eine passende Lösung mit gleicher "nr" UND ein Feld "anforderungsbereich" (siehe pädagogische Standards unten). Bei "zuordnung" müssen zuordnungLinks und zuordnungRechts gleich lang sein.
Bei "lueckentext" MUSS "wortliste" gesetzt sein: eine durcheinandergewürfelte Liste aus allen richtigen Lücken-Wörtern plus 1-2 plausiblen, aber falschen Ablenker-Wörtern. WICHTIG für echten Nutzen: bette die Lücke(n) NIE in einen isolierten Ein-Wort-Merksatz ein, sondern in einen inhaltlich zusammenhängenden Kontext von mindestens 1-2 vollständigen Sätzen, der wirkliches Verständnis prüft statt nur Wiedererkennen einer auswendiggelernten Vokabel (z.B. nicht nur "Der Fastenmonat heißt ______", sondern eine Aussage, die zusätzlich einen inhaltlichen Bezug/Grund/Zusammenhang nennt).
Bei "offene_frage" formuliere eine echte, SCHRIFTLICH zu beantwortende Reflexionsfrage, die zum Nachdenken anregt und wo sinnvoll einen Bezug zur Lebenswelt der Schüler:innen herstellt - keine reine Wissensabfrage. "loesung" ist auch hier keine einzelne feste Musterantwort, sondern ein kurzer Hinweis mit möglichen Aspekten, an denen sich eine gute Antwort orientieren kann.
Bei "reihenfolge" MUSS "reihenfolgeElemente" gesetzt sein: 3-6 kurze Ereignisse/Schritte in der RICHTIGEN chronologischen bzw. logischen Reihenfolge (das System mischt sie selbst für den Druck - du musst dich nicht um eine "zufällige" Anordnung kümmern, liefere sie einfach korrekt geordnet). "frage" ist die Arbeitsanweisung (z.B. "Bringe die Ereignisse in die richtige Reihenfolge, indem du die Zahlen 1-4 daneben einträgst."). "loesung" nennt die korrekte Reihenfolge in Klartext (z.B. "1. ..., 2. ..., 3. ...").
Bei "lesetext" MUSS "lesetext" gesetzt sein: ein kurzer, altersgerechter Lesetext (ca. 3-6 Sätze) zum Thema; "frage" ist eine echte Verständnisfrage, die sich konkret auf diesen Text bezieht (nicht auf Allgemeinwissen) und mehr verlangt als reines Wiederfinden einer Textstelle. Nur für Schulstufen einsetzen, die schon selbstständig lesen können (nicht bei 1. Klasse Volksschule, siehe Hinweis unten, falls zutreffend).
Bei "wahr_falsch" MUSS "frage" eine klare, thematisch konkrete Aussage formulieren und explizit zur Begründung auffordern (z.B. "Aussage: '...' — Ist diese Aussage wahr oder falsch? Begründe deine Antwort in 1-2 Sätzen."). "loesung" MUSS sowohl die richtige Einordnung (Wahr/Falsch) als auch eine kurze, konkrete Begründung enthalten - eine bloße "Wahr"/"Falsch"-Antwort ohne Begründung reicht NICHT.
Bei "malaufgabe" (besonders geeignet für 1. Klasse Volksschule, siehe Hinweis unten, falls zutreffend - aber auf ausdrücklichen Wunsch der Lehrkraft für jede Schulstufe zulässig) ist "frage" eine kurze, konkrete, mündlich vorlesbare Zeichenanweisung zum Thema (z.B. "Male die Moschee, in der die Menschen beten."). Du erzeugst KEIN Bild - die Schüler:innen zeichnen selbst auf dem ausgedruckten Blatt. "loesung" ist immer der feste Text "Individuelle Zeichnung".
Bei "bewegungsaufgabe" (Total Physical Response - besonders geeignet für 1. Klasse Volksschule, aber für jede Schulstufe nutzbar) ist "frage" eine kurze, klare Anweisung, wie die Klasse körperlich reagieren soll, wenn die Lehrkraft etwas Passendes vorliest (z.B. "Steht auf, wenn ich etwas nenne, das zum Gebet gehört. Bleibt sitzen, wenn nicht."). "bewegungsElemente" MUSS gesetzt sein: 5-8 kurze Begriffe/kurze Sätze zum Vorlesen - bewusst eine MISCHUNG aus passenden (lösen die Reaktion aus) und nicht-passenden Ablenker-Begriffen (keine Reaktion), sonst reagiert die ganze Klasse immer gleich und die Übung prüft nichts. "loesung" listet konkret auf, bei welchen der genannten Begriffe reagiert werden sollte und bei welchen nicht (z.B. "Reaktion bei: Gebetsteppich, Moschee, Sujud. Keine Reaktion bei: Ball, Schule, Fahrrad.").
Bei "sortierkarten" (Ausschneide-/Klebe-Übung - besonders geeignet für 1. Klasse Volksschule, aber für jede Schulstufe nutzbar) ist "frage" die Arbeitsanweisung (z.B. "Schneide die Karten aus und klebe jede in die richtige Spalte."). "sortierKategorien" MUSS gesetzt sein: 2-3 kurze Kategorie-Namen (z.B. ["Ramadan", "Gebet"]). "sortierKarten" MUSS gesetzt sein: 6-10 Objekte {"text": kurzer Begriff für die Ausschneide-Karte, "kategorie": MUSS exakt einem Eintrag aus "sortierKategorien" entsprechen}, jede Kategorie mit mindestens 2 Karten. "loesung" listet auf, welche Karten in welche Kategorie gehören.
Bei "nachspuruebung" (Schreib-/Schwungübung - besonders geeignet für 1. Klasse Volksschule, aber für jede Schulstufe nutzbar) ist "frage" eine kurze Anweisung (z.B. "Fahre das Wort nach."). "nachspurText" MUSS gesetzt sein: EIN kurzes, thematisch passendes Wort oder eine ganz kurze Phrase (max. 2-3 Wörter, z.B. "Allah", "Salam", "Bismillah") - KEIN ganzer Satz, da es mehrfach zum Nachfahren gedruckt wird. "loesung" ist immer der feste Text "Individuelles Nachspuren".
Wichtige Ausnahme bei der "Anzahl Aufgaben": "sortierkarten" ist für sich genommen schon umfangreich (mehrere Ausschneide-Kärtchen samt Kategorien) - erstelle davon HÖCHSTENS 1 Aufgabe pro Arbeitsblatt, egal wie hoch "Anzahl Aufgaben" ist oder ob nur dieser Typ erlaubt ist. Ist die angeforderte Gesamtzahl damit nicht erreichbar (z.B. nur "sortierkarten" erlaubt und Anzahl Aufgaben > 1), erstelle trotzdem nur so viele Aufgaben wie hier erlaubt - ein Arbeitsblatt mit weniger Aufgaben als angefordert ist hier ausdrücklich in Ordnung, die Grenze selbst NICHT überschreiten.
Jede verwendete Hadith-Quellenangabe MUSS die Sammlung im Feld "bezeichnung" nennen (z.B. "Sahih al-Bukhari, ...").`;

const VERIFICATION_SYSTEM_PROMPT_BASE = `Du bist eine unabhängige fachliche und pädagogische Prüferin für Arbeitsblätter im islamischen Religionsunterricht an österreichischen Schulen. Du bekommst ein fertig generiertes Arbeitsblatt als JSON und prüfst es kritisch:

1. Fachliche/theologische Plausibilität - wirken Koran-/Hadith-Angaben erfunden oder unsicher? Passt die Darstellung zu einer mehrheitsfähigen, für den staatlichen Unterricht geeigneten Position (Sunnah)?
2. Hadith-Quellen: stammen alle genannten Hadithe erkennbar aus Sahih al-Bukhari, Sahih Muslim oder einer anderen allgemein als sahih geltenden Sammlung? Wenn eine Quelle fehlt, unklar oder zweifelhaft ist, IMMER als Hinweis aufnehmen.
3. Lehrplan-/Altersgerechtigkeit: passen Komplexität und Sprache zum mitgelieferten Schulstufen-Cluster? UND, unabhängig davon: passt der tatsächliche Inhalt wirklich zur mitgelieferten Grundkompetenz (Themenbereich) - nicht nur oberflächlich thematisch verwandt, sondern erkennbar in deren eigentlicher Bedeutung (z.B. sollte es bei "Religiöses Handeln – Ibada" tatsächlich um religiöse Praxis/Rituale gehen, nicht nur allgemein ums Thema)? Falls das von der Lehrkraft vorgegebene Thema klar besser zu einer ANDEREN der sieben Grundkompetenzen passen würde als zur gewählten, IMMER als Hinweis aufnehmen (z.B. "Das Thema 'X' passt inhaltlich eher zu 'Glaubensbasis – Aqida' als zur gewählten Grundkompetenz 'Religiöses Handeln – Ibada' - für künftige Arbeitsblätter zu diesem Thema ggf. die passendere Grundkompetenz oder 'Grundkompetenz passend zum Thema wählen' nutzen.").
4. Vollständigkeit: hat jede Aufgabe eine Lösung? Sind Zuordnungen konsistent (gleiche Länge links/rechts)? Hat jede Lückentext-Aufgabe eine passende Wortliste (enthält das richtige Lösungswort plus 1-2 Ablenker) UND einen inhaltlich zusammenhängenden Kontext statt eines isolierten Ein-Wort-Merksatzes? Hat jede "reihenfolge"-Aufgabe mindestens 3 Elemente in einer nachvollziehbar korrekten Reihenfolge? Bezieht sich bei "lesetext" die Frage tatsächlich auf den mitgelieferten Text und verlangt mehr als reines Wiederfinden? Enthält jede "wahr_falsch"-Lösung sowohl die richtige Einordnung ALS AUCH eine konkrete Begründung (nicht nur "Wahr"/"Falsch")? Sind "malaufgabe"/"bewegungsaufgabe"/"sortierkarten"/"nachspuruebung" altersgerecht zur angegebenen Schulstufe eingesetzt? Enthält "bewegungsElemente" bei "bewegungsaufgabe" eine echte Mischung aus passenden und nicht-passenden Begriffen (nicht nur lauter passende)? Hat "sortierkarten" mindestens 2 Kategorien mit je mindestens 2 Karten, und gehört jede Karte tatsächlich eindeutig zu genau einer Kategorie? Ist "nachspurText" bei "nachspuruebung" wirklich nur ein kurzes Wort/eine kurze Phrase statt eines ganzen Satzes?
5. Sprachliche Korrektheit (Deutsch) und Sprachsensibilität (klare, altersgerechte Sätze, Fachbegriffe erklärt statt vorausgesetzt).
6. Neutralität/Eignung für konfessionellen Unterricht (keine kontroversen politischen Aussagen, keine Herabsetzung anderer Religionen/Gruppen).
6b. Terminologie: Wird durchgehend "Allah" statt "Gott" verwendet, grammatikalisch korrekt? Falls "Gott" irrtümlich vorkommt, als Hinweis aufnehmen.
6c. Transliteration: Enthält irgendein Text noch akademische IPA-Sonderzeichen in arabischen Begriffen (Makren wie ā/ī/ū, Unterpunkte wie ḥ/ṣ/ḍ/ṭ/ẓ, ʿAyn/Hamza als Modifier-Buchstabe ʿ/ʾ, oder andere Zeichen außerhalb des normalen deutschen Alphabets plus einfachem Apostroph)? Diese werden beim Druck als falsche Zufallszeichen dargestellt - IMMER als Hinweis aufnehmen, falls doch vorhanden.
6d. Umlaute: Enthält der TEXT (nicht die arabische Transliteration) fälschlich als "ue"/"oe"/"ae"/"ss" ausgeschriebene deutsche Wörter statt der richtigen Umlaute/ß (z.B. "ueber" statt "über", "koennen" statt "können", "Geruecht" statt "Gerücht")? Deutsche Umlaute/ß sind technisch problemlos druckbar - das wäre ein Rechtschreibfehler, stufe ihn als "fehler" ein (nicht nur "warnung"), falls er in mehreren Wörtern vorkommt.
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

/** Zusätzlicher System-Textblock für den Prüfungsmodus B (siehe app/klassen, GenerateRequest.
 * istPruefung) - wird bei istPruefung als weiterer, nicht gecachter Textblock NACH dem
 * curriculumContext angehängt (analog dazu variiert er pro Anfrage, siehe Kommentar bei
 * generiereUndPruefeEinmal). Ergänzt die Basis-Anweisungen, ersetzt sie nicht. */
const PRUEFUNGS_SYSTEM_PROMPT_ZUSATZ = `WICHTIGER ZUSATZ - dieses Arbeitsblatt ist eine formelle PRÜFUNG, KEINE Übung:
- Formuliere Kopf/Einleitung entsprechend formell wie bei einer echten Prüfung (kein motivierender Übungsblatt-Ton) - "einleitung" kann z.B. kurz Ablauf oder erlaubte Hilfsmittel nennen statt einzuleiten.
- Nenne es im Titel "Prüfung" oder "Test" - NICHT "Schularbeit": das ist in Österreich ein spezifischer, gesetzlich geregelter Begriff für bestimmte Fächer mit fixer Anzahl pro Schuljahr, den dieses Tool nicht für sich beanspruchen darf.
- Vergib für JEDE Aufgabe zusätzlich ein Feld "punkte" (ganze Zahl, mindestens 1). Die Summe aller "punkte"-Werte MUSS exakt der vorgegebenen Zielpunktzahl entsprechen. Gewichte anspruchsvollere Aufgaben (höherer Anforderungsbereich, mehr Teilschritte) mit mehr Punkten als einfache Reproduktionsaufgaben.
- Setze den Schwerpunkt klar auf AFB II (Reorganisation/Transfer) und AFB III (Reflexion/Urteil) statt überwiegend AFB I (Reproduktion) - eine Prüfung, die nur Auswendiggelerntes abfragt, prüft kein echtes Verständnis. Reine Reproduktionsaufgaben sollen deutlich in der Minderheit bleiben.
- Nutze ausschließlich die vorgegebenen, prüfungstauglichen Aufgabentypen - keine spielerischen Formate (keine Rätsel-, Bewegungs-, Ausschneide- oder Diskussionsaufgaben).`;

/**
 * Skaliert die von Claude vergebenen "punkte"-Werte proportional so, dass ihre Summe exakt
 * "punkteGesamt" ergibt - Sicherheitsnetz analog zu begrenzeAufgabenProTyp/loeseRaetselAuf:
 * Claude hält die geforderte Punktesumme im Prompt zuverlässig ungefähr, aber nicht immer exakt
 * ein, eine Prüfung mit "falscher" Gesamtpunktzahl wäre für die Lehrkraft aber unbrauchbar. Hat
 * Claude gar keine Punkte vergeben (alle undefined/0), wird stattdessen gleichmäßig verteilt.
 */
export function normalisierePruefungspunkte(content: WorksheetContent, punkteGesamt: number): void {
  const aufgaben = content.aufgaben;
  if (aufgaben.length === 0) return;
  const summe = aufgaben.reduce((s, a) => s + (a.punkte ?? 0), 0);

  if (summe <= 0) {
    const proAufgabe = Math.floor(punkteGesamt / aufgaben.length);
    let rest = punkteGesamt - proAufgabe * aufgaben.length;
    for (const a of aufgaben) {
      a.punkte = proAufgabe + (rest > 0 ? 1 : 0);
      if (rest > 0) rest--;
    }
    return;
  }

  let zugewiesen = 0;
  let groessteIdx = 0;
  aufgaben.forEach((a, i) => {
    const skaliert = Math.max(1, Math.round(((a.punkte ?? 0) / summe) * punkteGesamt));
    a.punkte = skaliert;
    zugewiesen += skaliert;
    if (skaliert > (aufgaben[groessteIdx].punkte ?? 0)) groessteIdx = i;
  });
  // Rundungsdifferenz auf die Aufgabe mit dem größten Punktewert ausgleichen - verzerrt dort am
  // wenigsten sichtbar (relativ zu ihrem eigenen Wert).
  const differenz = punkteGesamt - zugewiesen;
  if (differenz !== 0) {
    aufgaben[groessteIdx].punkte = Math.max(1, (aufgaben[groessteIdx].punkte ?? 1) + differenz);
  }
}

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
  formatErinnerung?: boolean,
): string {
  const korrekturBlock = korrekturAuftrag
    ? `\n\nWICHTIG - Korrekturauftrag: Ein vorheriger Versuch für dieses Arbeitsblatt wurde bei der Qualitätsprüfung als "fehler" eingestuft. Erstelle das Arbeitsblatt neu und behebe dabei GEZIELT diese konkreten Probleme (beim Rest darfst du dich frei orientieren, nicht stur am alten Versuch festhalten):\n${korrekturAuftrag.hinweise.map((h) => `- ${h}`).join("\n")}\nZusammenfassung der vorherigen Prüfung: ${korrekturAuftrag.zusammenfassung}`
    : "";
  const formatBlock = formatErinnerung
    ? `\n\nWICHTIG: Deine letzte Antwort enthielt keine oder keine vollständige gültige JSON-Struktur. Antworte dieses Mal AUSSCHLIESSLICH mit dem rohen JSON-Objekt gemäß der vorgegebenen Struktur - kein einleitender oder erklärender Text davor oder danach, keine Markdown-Codeblock-Markierungen.`
    : "";

  return `Erstelle ein Arbeitsblatt mit folgenden Vorgaben:
- Bereich/Fach: ${req.bereich}
- Thema: ${req.thema}
- Schulstufe: ${req.schulstufe}
- Zieldauer für die Bearbeitung im Unterricht: ${req.zieldauerMinuten} Minuten (Richtwert, keine exakte Messung möglich)
- Komplexität: ${KOMPLEXITAET_LABEL[req.komplexitaet]}
- Anzahl Aufgaben (aus der Zieldauer abgeleiteter Richtwert - Ziel ist, die Zieldauer zu treffen, nicht exakt diese Zahl): ${anzahlAufgaben}
- Erlaubte Aufgabentypen (mische sinnvoll): ${req.aufgabentypen.join(", ")}
${req.istPruefung ? `- Diese Erstellung ist eine formelle PRÜFUNG mit einer Zielpunktzahl von ${req.punkteGesamt} Punkten (siehe Zusatzanweisungen).` : ""}
${req.zusatzhinweise ? `- Zusätzliche Hinweise der Lehrkraft: ${req.zusatzhinweise}` : ""}${korrekturBlock}${formatBlock}`;
}

export interface GenerationResult {
  content: WorksheetContent;
  verification: Verification;
  usage: UsageEintrag[];
}

export async function generateAndVerifyWorksheet(
  req: GenerateRequest,
): Promise<GenerationResult> {
  const curriculumContext = buildCurriculumSystemContext(req.themenbereich, req.schulstufe, req.komplexitaet);
  const anzahlAufgaben = schaetzeAufgabenAnzahl(req.zieldauerMinuten, req.aufgabentypen, req.komplexitaet);

  let ersterVersuch: GenerationResult;
  try {
    ersterVersuch = await generiereUndPruefeEinmal(req, curriculumContext, anzahlAufgaben);
  } catch (err) {
    // Reines Format-Problem (siehe UngueltigesModellFormat) statt eines inhaltlichen Mangels -
    // die Qualitätsprüfung wurde in diesem Fall nie erreicht, ein Wiederholungsversuch mit einer
    // expliziten Format-Erinnerung behebt das fast immer. Bei jedem anderen Fehler (Netzwerk,
    // Rate-Limit, abgeschnittene Antwort wegen zu vieler Aufgaben) hilft ein blinder
    // Wiederholungsversuch nicht und würde nur unnötig weitere Kosten verursachen.
    if (!(err instanceof UngueltigesModellFormat)) throw err;
    ersterVersuch = await generiereUndPruefeEinmal(
      req,
      curriculumContext,
      anzahlAufgaben,
      undefined,
      true,
    );
  }

  // Automatischer zweiter Versuch NUR bei "fehler" (ein von der Prüfung erkannter echter Mangel) -
  // NICHT bei "warnung" (das Blatt ist nutzbar, nur mit Hinweisen zum Gegenchecken). Die konkrete
  // Kritik aus der ersten Prüfung wird als Korrekturauftrag mitgegeben, damit der zweite Versuch
  // gezielt das Problem behebt statt blind neu zu würfeln. Ohne diesen zweiten Versuch würde ein
  // von der eigenen Prüfung als fehlerhaft erkanntes Arbeitsblatt bisher trotzdem unverändert an
  // die Lehrkraft ausgeliefert (nur mit Status "verworfen" im Hintergrund).
  if (ersterVersuch.verification.status !== "fehler") return ersterVersuch;
  const zweiterVersuch = await generiereUndPruefeEinmal(
    req,
    curriculumContext,
    anzahlAufgaben,
    ersterVersuch.verification,
  );
  // Tokens beider Versuche zählen für die Nutzungsstatistik (siehe lib/usageLog.ts) - der erste,
  // verworfene Versuch hat trotzdem echte Kosten verursacht.
  return { ...zweiterVersuch, usage: [...ersterVersuch.usage, ...zweiterVersuch.usage] };
}

async function generiereUndPruefeEinmal(
  req: GenerateRequest,
  curriculumContext: string,
  anzahlAufgaben: number,
  korrekturAuftrag?: Verification,
  formatErinnerung?: boolean,
): Promise<GenerationResult> {
  const client = getAnthropicClient();

  const genResponse = await client.messages.create({
    model: GENERATION_MODEL,
    // Bewusst deutlich über dem tatsächlichen Bedarf (siehe AUFGABEN_TYP_MAXIMUM: max. 10
    // Aufgaben gesamt, "große" Typen wie Kreuzworträtsel/Wortsuche schon auf 1 pro Blatt
    // gedeckelt) - reiner Sicherheitsspielraum für den Fall vieler gleichzeitig gewählter,
    // inhaltsreicher Aufgabentypen bei 50 Minuten Zieldauer. War bereits einmal von 8000 auf
    // 16000 angehoben, weil das alte Limit die Antwort mitten im JSON abschnitt
    // ("Keine JSON-Struktur in der Modellantwort gefunden").
    max_tokens: 24000,
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
      ...(req.istPruefung ? [{ type: "text" as const, text: PRUEFUNGS_SYSTEM_PROMPT_ZUSATZ }] : []),
    ],
    messages: [
      { role: "user", content: buildUserPrompt(req, anzahlAufgaben, korrekturAuftrag, formatErinnerung) },
    ],
  });

  if (genResponse.stop_reason === "max_tokens") {
    throw new Error(
      "Die Antwort des Modells wurde wegen zu vieler Aufgaben/Inhalte abgeschnitten. Bitte weniger Aufgaben oder weniger Aufgabentypen gleichzeitig anfordern.",
    );
  }
  let rawContent: unknown;
  try {
    rawContent = extractJson(getTextFromMessage(genResponse));
  } catch (err) {
    throw new UngueltigesModellFormat(err instanceof Error ? err.message : String(err));
  }
  let content: WorksheetContent;
  try {
    content = WorksheetContentSchema.parse(rawContent);
  } catch {
    throw new UngueltigesModellFormat("Die Antwort entsprach nicht der erwarteten Struktur.");
  }
  // Sicherheitsnetz für den Fall, dass sich das Modell trotz Prompt-Anweisung nicht an
  // diakritikfreie Transliteration hält (siehe lib/transliteration.ts) - VOR der Verifikation,
  // damit die geprüfte und gespeicherte Version bereits die sicher darstellbare ist.
  content = vereinfacheArabischeTransliteration(content);
  begrenzeAufgabenProTyp(content);
  if (req.istPruefung && req.punkteGesamt) normalisierePruefungspunkte(content, req.punkteGesamt);
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

  const usage = [
    usageEintragAusAntwort(GENERATION_MODEL, "generierung", genResponse.usage),
    usageEintragAusAntwort(VERIFICATION_MODEL, "pruefung", verifyResponse.usage),
  ];

  return { content, verification, usage };
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
