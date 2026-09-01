# Lernwerk

Webanwendung zur automatischen Erstellung und Prüfung von Unterrichts-Arbeitsblättern.
Du gibst Bereich, Thema, Schulstufe und ein grobes Layout vor – der Inhalt wird per Claude API
generiert und anschließend von einem zweiten, unabhängigen Prüf-Durchlauf gegengecheckt
(fachlich, altersgerecht, vollständig). Ausgangspunkt/Standardbereich ist der islamische
Religionsunterricht an Schulen in Österreich, der Bereich ist pro Arbeitsblatt aber frei wählbar.

## Ablauf

1. Auf **„Neues Arbeitsblatt“** Bereich, Thema, Schulstufe, Aufgabentypen und Layout festlegen.
2. Claude generiert den Inhalt als strukturiertes JSON (Aufgaben, Lösungen, Quellenangaben).
3. Ein zweiter Claude-Aufruf prüft den Inhalt (Status `ok` / `warnung` / `fehler` + Hinweise).
4. Ergebnis ansehen, als PDF oder Word (.docx) exportieren.

Religiöse Quellenangaben (Koran/Hadith) werden bewusst konservativ generiert und, wo Unsicherheit
besteht, als **„bitte prüfen“** markiert – das System ersetzt keine fachliche Endkontrolle durch
eine Lehrkraft.

## Lehrplan- und Quellen-Verankerung

Generierung und Verifikation orientieren sich an der öffentlich bekannten Grobstruktur des
aktuellen österreichischen Lehrplans für islamischen Religionsunterricht der IGGÖ
("Lehrplan IRU NEU"):

- **Themenbereich** pro Arbeitsblatt wählbar: Iman (Glaubenslehre), Fiqh al-Ibadat
  (gottesdienstliche Praxis), Fiqh al-Muamalat (zwischenmenschliche Beziehungen/Ethik),
  Islamische Kulturgeschichte – oder automatisch passend zum Thema.
- **Schulstufen-Cluster** (Volksschule, Sekundarstufe I, Polytechnische Schule, Sekundarstufe
  II, Berufsschule) steuern Sprachniveau und Komplexität.
- **Hadithe** werden nur aus Sahih al-Bukhari/Sahih Muslim (bevorzugt) oder anderen allgemein als
  sahih geltenden Sammlungen verwendet; die Verifikation prüft das gezielt gegen.
- Siehe `lib/curriculum.ts` für Details und Quellenangaben (inkl. rechtlicher Grundlage). Diese
  App bildet die Lehrplan-Struktur nur orientierend ab (kein Volltext-Zugriff) – die Lehrkraft
  prüft die konkrete Passung zur jeweiligen Schulart/Schulstufe weiterhin anhand des offiziellen
  Lehrplans der IGGÖ.

## Pädagogisch-didaktische Fundierung

Jede Aufgabe wird einem **Anforderungsbereich** zugeordnet (AFB I Reproduktion, AFB II Transfer,
AFB III Reflexion/Urteil – etabliertes Modell aus österreichischer/deutscher Aufgabenkultur,
z.B. Zentralmatura), sichtbar als kleines Label neben jeder Aufgabe. Die Verteilung wird an die
Schulstufe angepasst (Volksschule primär AFB I/II, höhere Schulstufen bewusst mit AFB-III-Anteil).
Das Lernziel wird kompetenzorientiert/operationalisiert formuliert. Zusätzlich orientiert sich die
Generierung an den fünf anerkannten Kompetenzbereichen des Religionsunterrichts (Wahrnehmung,
religiöse Sach-/Darstellungskompetenz, interkulturelle/interreligiöse Kompetenz, ethische
Deutungs-/Urteilskompetenz, lebensweltliche Anwendungskompetenz) sowie an sprachsensiblem
Unterricht und Lebensweltbezug. Details in `lib/curriculum.ts`.

### Aufgabentypen

Bewusst wenige, aber didaktisch bewährte Aufgabentypen statt einer breiten, beliebigen Auswahl -
"lieber gute Methoden als Nonsens-Vielfalt". Zehn Typen stehen für alle Schulstufen zur
Verfügung: Multiple Choice, Lückentext (mit inhaltlichem Satzkontext statt isolierter
Ein-Wort-Lücke), Zuordnung, Offene Frage (schriftliche Reflexion), Wahr oder Falsch (MIT
Pflicht-Begründung statt reinem Raten), Reihenfolge, Lesetext mit Verständnisfrage,
Diskussionsimpuls (echtes Dilemma/mehrere Perspektiven statt einer Frage mit offensichtlicher
Antwort), Kreuzworträtsel, Wortsuche. Zwei weitere Typen sind IMMER wählbar, bekommen aber je nach
Schulstufe nur eine Empfehlung im Erstellen-Formular statt einer harten Sperre - die Lehrkraft
kennt ihre Klasse besser als eine grobe Schulstufen-Heuristik:

- **Malaufgabe** (empfohlen für 1. Klasse Volksschule): eine kurze, mündlich vorlesbare
  Zeichenanweisung zum Thema - die Schüler:innen zeichnen selbst auf dem ausgedruckten Blatt
  (kein KI-generiertes Bild, siehe Hinweis unten).
- **Recherche-/Referatsauftrag** (empfohlen ab Sekundarstufe I): eine längerfristige Projekt-/
  Hausaufgabe zu einer Person, einem Ort, Gegenstand oder Konzept aus dem Thema, mit von Claude
  generiertem Leitfaden (konkrete Recherchefragen), Bewertungskriterien und einem Hinweis zu
  vertrauenswürdigen Quellenarten (oder einem kurzen Sachtext als Basis ohne Internetzugang) -
  nicht für eine einzelne Unterrichtseinheit gedacht.
- **Bewegungsaufgabe** (Total Physical Response, empfohlen für 1. Klasse Volksschule): die
  Lehrkraft liest eine Mischung aus passenden und nicht-passenden Begriffen vor, die Klasse
  reagiert körperlich (aufstehen/zeigen/klatschen) bei den passenden - prüft Verständnis ganz
  ohne Lese-/Schreibkompetenz.
- **Sortierkarten** (empfohlen für 1. Klasse Volksschule): Ausschneide-Kärtchen, die in 2-3
  vorgegebene Kategorien einsortiert und geklebt werden - haptisch, fördert echtes
  Kategorienverständnis statt nur Motorik. Die richtige Zuordnung erscheint bewusst nur in der
  Lösung, nicht auf den Karten selbst.
- **Nachspurübung** (empfohlen für 1. Klasse Volksschule): ein kurzes, thematisch passendes
  Wort mehrfach in heller Schrift zum Nachfahren - klassische Schreibmotorik-Übung.

Kreuzworträtsel, Wortsuche, Recherche-/Referatsauftrag und Sortierkarten sind inhaltlich schon
für sich umfangreich und werden serverseitig auf höchstens 1 Aufgabe pro Arbeitsblatt begrenzt,
unabhängig von der insgesamt gewählten Aufgabenzahl.

### Aufgaben für noch nicht lese-/schreibkundige Kinder (1. Klasse Volksschule)

Für die 1. Schulstufe (Kinder können zu Schulbeginn meist noch nicht lesen/schreiben) wird die
Generierung zu besonders geeigneten Aufgaben angeleitet - bevorzugt „Bewegungsaufgabe",
„Sortierkarten", „Malaufgabe" und „Nachspurübung" (alle vier ohne Lese-/Schreibkompetenz lösbar),
ergänzend „Wahr oder Falsch“, „Multiple Choice“ mit ganz wenigen, kurzen Antwortoptionen und
„Zuordnung“ mit wenigen, sehr kurzen Begriffen, statt textlastiger Aufgabentypen. Im
Erstellen-Formular gibt es dafür eine Empfehlung samt Schnellauswahl, sobald „1. Klasse
Volksschule“ als Schulstufe gewählt ist. Ab der 2. Klasse Volksschule gelten diese vier Typen
nicht mehr als spezifisch empfohlen (siehe `istFrueheVolksschulstufe` in `lib/curriculum.ts`) -
die meisten Kinder sind dann bereits funktional lese-/schreibfähig, auch wenn noch nicht geübt.

> Frühere Versionen boten stattdessen bildbasierte Aufgabentypen („Ausmalbild“,
> „Bildergeschichte“) mit live per Bild-KI (Google Gemini) generierten Motiven an. Diese Funktion
> wurde entfernt (zu kosten- und wartungsintensiv) und durch die reine Zeichen-Anweisung
> „Malaufgabe“ ersetzt (kein KI-Bild, kein zusätzlicher Kostenfaktor). Bereits erstellte
> Arbeitsblätter mit den alten Bild-Aufgaben bleiben aber unverändert ansehbar, druckbar und
> bearbeitbar.

## Layout-Extras

- **Islamisches Datum**: zeigt im Kopfbereich zusätzlich zum gregorianischen das rechnerische
  Hijri-Datum (tabellarischer Kalender) an, inkl. Hinweis auf mögliche ±1-Tag-Abweichung durch
  Mondsichtung (`lib/hijri.ts`). Optional abschaltbar - sinnvoll nur, wenn das Arbeitsblatt am
  Drucktag selbst ausgeteilt wird. Ist das Datum im Kopfbereich eingeschaltet, entfällt
  automatisch das leere „Datum: ______“-Feld in der Zeile „Name / Klasse / Datum“ (der Schüler
  würde dort ohnehin ein anderes, eigenes Datum eintragen als das oben schon aufgedruckte); ist
  es ausgeschaltet, bleibt das Feld zum Selbst-Ausfüllen wie gewohnt bestehen.
- **Musterstreifen**: ein Zierstreifen im Girih-Stil (wie klassische maurische/Alhambra-
  Randmuster) unter dem Kopfbereich, mit drei auswählbaren Varianten (`lib/patternStrip.ts`,
  Auswahl im Erstellen-Formular mit Live-Vorschau je Muster):
  - **Teppich** (intern `sterne`): achtzackiger Stern mit innerem Kern, ineinandergreifende
    Rauten-/Vieleck-Formen - ein dichtes Girih-Gitter, das eher teppich-/kachelartig wirkt statt
    einzelner erkennbarer Sterne (daher umbenannt, um Verwechslung mit "Stern"/`stern12` zu
    vermeiden).
  - **Halbmond**: zwei Mondsicheln flankieren eine Raute, beide zur Mitte hin geöffnet. Die
    Mondsichel ist als ein einziger, geschlossener Pfad aus zwei gegenläufigen Kreisbögen
    gezeichnet - zwei separate, sich überlappende volle Kreise würden bei `fill="none"` nur als
    zwei offene Ringe erscheinen, nicht als Sichel. Die beiden Halbmonde sind zueinander
    gespiegelt, sonst würden beide in dieselbe statt in die jeweils andere Richtung zeigen.
  - **Stern**: zwölfzackiger Stern, flankiert von Rauten - rein geometrisch.

  Alle drei fließen unter dem Kopfbereich ganz normal mit dem Text statt frei/absolut
  positioniert zu sein - kollidieren daher nie mit Titel oder Meta-Zeilen. Eigene Vektor-Kacheln,
  wiederholen sich beliebig oft nebeneinander über die volle Breite, ohne verzerrt zu werden.
  Ohne Gottesname/Koran-Vers (gleiche Begründung wie zuvor: Arbeitsblätter landen im Schulalltag
  auch mal auf dem Boden). In Web als echtes SVG-`<pattern>` (kachelt automatisch auf jede
  Breite); in PDF als explizit passend oft wiederholte Kachel (react-pdf kennt kein `<pattern>`,
  die Seitenbreite ist dort aber ohnehin fix bekannt); in Word als einmalig serverseitig
  gerenderte, auf die Satzspiegelbreite zugeschnittene PNG je Variante
  (`public/patterns/leiste-{sterne,halbmond,stern12}.png`). Optional abschaltbar.
- **Druckfarbe (Farbe / Schwarz-Weiß)**: da die meisten Arbeitsblätter in der Schule ohnehin
  schwarzweiß ausgedruckt werden, lässt sich das pro Arbeitsblatt umschalten. Im Schwarz-Weiß-
  Modus wird der farbige Kopfbereich der „Modern“-Vorlage durch die schlichte, umrandete
  Kopfzeile ersetzt und alle Akzentfarben (Muster, Überschriften) werden schwarz/dunkelgrau statt
  grün/gold - in Web, PDF und Word konsistent.

## Konten &amp; Abo-Kontingent

Die App hat ein einfaches Login-System (E-Mail + Passwort, Selbst-Registrierung unter
`/register`) - jedes Konto sieht ausschließlich seine eigenen Arbeitsblätter. Es gibt **keine
Zahlungsanbieter-Integration**: Abos werden privat organisiert (z.B. Überweisung), ein Admin
schaltet danach manuell unter `/admin` das Kontingent frei.

- **Erster registrierter Account wird automatisch Admin** (es gibt noch keinen anderen Weg,
  Admin-Rechte zu vergeben) - dieser Account sollte also der/die Betreiber:in sein. **Admin-Konten
  haben kein Kontingent-Limit** (weder persönlich noch über die Browser-/IP-Sperre) - `/new` und
  das Dashboard zeigen dafür ein eigenes „unbegrenztes Kontingent"-Banner statt einer Zahl.
- **Zwei Stufen** (siehe `lib/quota.ts`): „Kostenlos" (`KOSTENLOS_LIMIT`, aktuell 4
  Arbeitsblätter EINMALIG fürs ganze Konto - automatisch, ohne Admin-Freischaltung, kein
  monatlicher Reset) und ein einziges bezahltes „Abo" (3,50€ / 11 Arbeitsblätter **im Monat**,
  siehe Kommentar bei `TIER_QUOTA` für die Margen-Kalkulation - basiert bisher auf der groben
  Pauschalschätzung, sollte aber gegen die echte, gemessene Kosten pro Arbeitsblatt geprüft
  werden, siehe "Ø Kosten pro Arbeitsblatt (echt)" im Admin-Bereich). Bewusst nur ein
  Bezahl-Tarif statt einer Staffelung - einfacher zu kommunizieren, ohne dass Lehrkräfte
  zwischen mehreren Paketen abwägen müssen. Jedes frisch registrierte Konto startet automatisch
  auf „Kostenlos"; ein Admin schaltet unter `/admin` bei Bedarf auf das Abo hoch. Intern bleibt
  der Datenbankwert `"pro"` (historisch gewachsen aus einer früheren Zwei-Tarif-Version;
  `"starter"` existiert nur noch als Abwärtskompatibilitäts-Alias für Konten von davor).
- **Rollierender 30-Tage-Zyklus** ab dem individuellen Konto-Erstellungsdatum (nicht ab dem
  Kalendermonat) gilt NUR fürs bezahlte Abo. Für Konten ohne aktives Abo zählt `getKontingent`
  stattdessen über die gesamte Kontolebenszeit (`KOSTENLOS_LIMIT` ist einmalig, kein
  wiederkehrendes Monats-Kontingent) - sonst würde die Gratis-Stufe bei wachsender Kontenzahl zu
  einem unbegrenzt mitwachsenden Kostenblock ohne Gegenfinanzierung.
- Ist das Kontingent aufgebraucht, wird das schon in `/new` sichtbar (Banner + deaktivierter
  „Arbeitsblatt erstellen"-Button) und serverseitig in `/api/generate` **vor** dem teuren
  Claude-Aufruf geprüft, damit ein blockiertes Konto keine API-Kosten verursacht.
- **Ein Login ist für jede Generierung Pflicht** - nicht angemeldete Besucher sehen auf `/`
  keine Login-Maske, sondern eine Produkt-/Verkaufsseite (Funktionen, Kostenlos-/Abo-Preise) mit
  Call-to-Action zur (kostenlosen) Registrierung.
- **`/admin`** ist auf Konten-Verwaltung ausgelegt: Kennzahlen (Konten gesamt, aktive bezahlte
  Abos, geschätzter Monatsumsatz), Suche nach E-Mail, Kontingent-Nutzung und Gesamtzahl
  erstellter Arbeitsblätter je Konto, sowie Konten löschen (das eigene Admin-Konto ausgenommen -
  dessen Arbeitsblätter bleiben beim Löschen eines Kontos erhalten, nur der Besitzer-Bezug
  entfällt).

### Missbrauchsschutz für das kostenlose Kontingent

Ein Konto zu registrieren ist selbst kostenlos (nur E-Mail + Passwort) - ohne weitere Sperre
könnte sich also jemand beliebig viele Konten anlegen, um ein Vielfaches des (seit der Umstellung
auf einmalig ohnehin schon begrenzten) Gratis-Kontingents zu bekommen. Deshalb wird die
**kostenlose** Stufe (nicht das Abo - das wurde von einem Admin manuell freigeschaltet)
zusätzlich über zwei unabhängige, browser-/netzwerkbasierte Zähler begrenzt (`lib/trial.ts`) -
blockiert wird, sobald **einer** der beiden das Limit erreicht, unabhängig davon, welches Konto
gerade eingeloggt ist. Beide Zähler sind LEBENSLANG (nicht pro Monat), analog zu
`KOSTENLOS_LIMIT` selbst - sonst könnte man über denselben Browser/dieselbe IP jeden Monat mit
einem neuen Konto erneut das "einmalige" Gratis-Kontingent bekommen:
- **Cookie** (Browser, `trial_usage`) - verhindert das naive "neues Konto, gleicher Browser".
- **IP-Adresse** (Server, Tabelle `TrialUsage`, weiterhin pro Monat abgelegt, aber beim Lesen
  über ALLE Monate hinweg aufsummiert) - verhindert, dass Cookies löschen, ein privater Tab oder
  ein neues Gerät allein das Kontingent vervielfachen.

Kein Geräte-Fingerprinting. Bekannte, bewusst in Kauf genommene Grenze: mehrere Lehrpersonen im
selben Schul-WLAN teilen sich oft dieselbe öffentliche IP-Adresse und damit faktisch ein
gemeinsames Gratis-Kontingent (unabhängig von ihren jeweils eigenen Konten) - und wer über
Mobilfunknetz statt WLAN testet oder ein VPN nutzt, umgeht das zusätzlich. Eine wirklich
wasserdichte Einzelpersonen-Grenze gibt es technisch nicht, ohne stärkere Identitätsprüfung
(z.B. E-Mail-Bestätigung oder Telefonnummer) zu verlangen - das ist der bewusst gewählte
Kompromiss zwischen Registrierungs-Reibungslosigkeit und Missbrauchsschutz. IP-Adressen werden
dafür nur mit Monat + Zähler gespeichert, nicht mit weiteren Daten verknüpft.

## Arbeitsblätter verwalten

Auf der Übersichtsseite lässt sich jedes Arbeitsblatt einzeln löschen (Papierkorb-Symbol), ebenso
auf der Detailseite eines Arbeitsblatts über den „Löschen"-Button - jeweils mit
Sicherheitsabfrage, da das Löschen unwiderruflich ist. Bewusst kein „Alle löschen" auf einmal
(auch nicht als API-Route) - jede kritische Löschaktion auf der Seite verlangt eine explizite
Bestätigung und betrifft immer nur ein einzelnes Arbeitsblatt bzw. Konto.

## Setup

```bash
npm install
cp .env.example .env   # DATABASE_URL und ANTHROPIC_API_KEY eintragen
npx prisma migrate deploy
npm run dev
```

Für lokale Entwicklung brauchst du eine eigene Postgres-Instanz (z.B. lokal installiert oder via
Docker: `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16`).

Danach [http://localhost:3000](http://localhost:3000) öffnen.

### Umgebungsvariablen (`.env`)

- `DATABASE_URL` – Postgres-Verbindung. Auf Vercel automatisch durch die Postgres-Integration
  (Storage-Tab) gesetzt.
- `ANTHROPIC_API_KEY` – dein Anthropic API-Key
- `GMAIL_USER` / `GMAIL_APP_PASSWORT` – für den Versand der Bestätigungs-Mail bei der
  Registrierung (E-Mail-Verifizierung, siehe unten). Beide PFLICHT, sonst schlägt jede
  Registrierung fehl.
- `NEXT_PUBLIC_SENTRY_DSN` – optional, für Fehlerüberwachung in Produktion (siehe unten). Ohne
  gesetzten Wert läuft die App normal weiter, nur ohne Fehlerberichte.

Kein separates Auth-Secret nötig: Sessions sind DB-gestützt (Tabelle `Session`), das Cookie
enthält nur ein zufälliges Token, keinen signierten/verschlüsselten Wert.

### E-Mail-Verifizierung

Registrierung erfordert die Bestätigung der E-Mail-Adresse per Link, bevor ein Login möglich ist
(verhindert Registrierungen mit falschen/erfundenen Adressen). Versand über ein privates
Gmail-Konto (SMTP), kostenlos, ohne eigenen Domain-Zugriff:

1. An einem Gmail-Konto (kann ein eigens dafür angelegtes sein) 2-Faktor-Authentifizierung
   aktivieren, falls noch nicht geschehen: [myaccount.google.com/security](https://myaccount.google.com/security).
2. Unter [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) ein neues
   App-Passwort erzeugen (App-Name frei wählbar, z.B. "Lernwerk"). Google zeigt ein
   16-stelliges Passwort NUR einmal an.
3. `GMAIL_USER` = die volle Gmail-Adresse, `GMAIL_APP_PASSWORT` = das 16-stellige App-Passwort
   (ohne Leerzeichen) - lokal in `.env`, auf Vercel unter **Settings → Environment Variables**.

Bestandskonten (vor Einführung dieses Features registriert) gelten automatisch als verifiziert -
nur Neuregistrierungen müssen den Link bestätigen. Nach der ersten erfolgreichen Anmeldung kann
unter „Mein Konto" ein Benutzername gesetzt werden, um sich künftig damit statt mit der vollen
E-Mail-Adresse anzumelden.

### Fehlerüberwachung (Sentry)

Meldet unbehandelte Fehler (Server, Client, Edge-Runtime) automatisch an
[sentry.io](https://sentry.io) - ohne das würde ein Absturz in Produktion nur auffallen, wenn
sich zufällig eine Lehrkraft meldet.

1. Kostenloses Konto auf [sentry.io](https://sentry.io) anlegen, neues Projekt mit Plattform
   "Next.js" erstellen.
2. Den angezeigten DSN (eine URL, kein Passwort, aber trotzdem nicht öffentlich teilen) als
   `NEXT_PUBLIC_SENTRY_DSN` setzen - lokal in `.env`, auf Vercel unter
   **Settings → Environment Variables**.

Ohne gesetzten Wert initialisiert sich Sentry gar nicht erst (siehe `sentry.*.config.ts`) - kein
Setup-Zwang für die lokale Entwicklung. Source-Map-Upload (für lesbare statt minifizierte
Stacktraces in der Sentry-Oberfläche) ist bewusst nicht eingerichtet, um kein zusätzliches
Sentry-Auth-Token als Secret zu brauchen - kann bei Bedarf in `next.config.js`
(`withSentryConfig`-Optionen `org`/`project`/`authToken`) nachgerüstet werden.

### Tests

```bash
npm test          # einmal ausführen
npm run test:watch  # bei jeder Änderung neu ausführen
```

Deckt bewusst nur reine, DB-/netzwerkfreie Logik unter `lib/` ab (z.B. Kontingent-Berechnung,
Lehrplan-Zuordnung, Hijri-Datum) - `*.test.ts` neben der jeweiligen Datei. Kein Aufbau gegen eine
echte Datenbank oder externe APIs (Claude/Mail) - dafür gibt es die manuellen
Smoke-Tests pro Feature (siehe Commit-Historie). Neue, nicht-triviale Funktionen in `lib/`
sollten bei Gelegenheit einen Test bekommen, muss aber nicht bei jeder Änderung nachgezogen
werden - kein Zwang, der die Entwicklung ausbremst.

## Deployment (Vercel)

1. Projekt in Vercel aus diesem GitHub-Repo importieren.
2. Im Tab **Storage** eine Postgres-Datenbank anlegen (setzt `DATABASE_URL` automatisch).
3. Unter **Settings → Environment Variables** `ANTHROPIC_API_KEY`, `GMAIL_USER` und
   `GMAIL_APP_PASSWORT` (und optional `NEXT_PUBLIC_SENTRY_DSN`) eintragen.
4. Deployen – der Build-Schritt (`prisma migrate deploy && next build`) legt das Datenbankschema
   automatisch an.

SQLite (lokale Datei) funktioniert nicht auf Vercel, da dort keine dauerhafte Festplatte zur
Verfügung steht – deshalb Postgres statt SQLite.

Sobald die App gegen Bezahlung an andere angeboten wird (auch wenn die Bezahlung privat/außerhalb
der App abgewickelt wird), ist das kommerzielle Nutzung im Sinne der Vercel-Nutzungsbedingungen –
dafür ist ein bezahlter Vercel-Tarif (Pro) nötig, der kostenlose Hobby-Tarif reicht dann nicht.

## Tech-Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL (Verlauf aller generierten Arbeitsblätter)
- `@anthropic-ai/sdk` (Modell: `claude-opus-5`) für Generierung + Verifikation - die statischen
  System-Prompts (Rolle/Regeln/JSON-Schema) sind je Aufruf per `cache_control` (1h-TTL) gecacht,
  da sie bei jeder Anfrage byte-identisch sind; nur der kleine, pro Anfrage variierende
  Lehrplan-Kontext (Themenbereich/Schulstufe) steht ungecacht danach
- `@react-pdf/renderer` für PDF-Export, `docx` für Word-Export
- Drei Layout-Vorlagen (Klassisch / Modern / Kompakt), je mit Schulname, Schriftgröße,
  „Lösungen separat“, islamischem Datum und Musterstreifen konfigurierbar

## Erweiterungsideen

- Automatischer täglicher Lauf (Cron) statt manuellem Button, sobald gewünscht
- Foto-/Bild-Export der Vorschau
- Mehrere hinterlegte Bereiche/Themenlisten zur Rotation
