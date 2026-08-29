# Arbeitsblatt-Generator

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
österreichischen Lehrplans für islamischen Religionsunterricht (IGGÖ, BGBl. II Nr. 234/2011):

- **Themenbereich** pro Arbeitsblatt wählbar: Iman (Glaubenslehre), Fiqh al-Ibadat
  (gottesdienstliche Praxis), Fiqh al-Muamalat (zwischenmenschliche Beziehungen/Ethik),
  Islamische Kulturgeschichte – oder automatisch passend zum Thema.
- **Schulstufen-Cluster** (Volksschule, Sekundarstufe I, Polytechnische Schule, Sekundarstufe
  II, Berufsschule) steuern Sprachniveau und Komplexität.
- **Hadithe** werden nur aus Sahih al-Bukhari/Sahih Muslim (bevorzugt) oder anderen allgemein als
  sahih geltenden Sammlungen verwendet; die Verifikation prüft das gezielt gegen.
- Siehe `lib/curriculum.ts` für Details und Quellenangaben. Diese App bildet die Lehrplan-Struktur
  nur orientierend ab (kein Volltext-Zugriff) – die Lehrkraft prüft die konkrete Passung zur
  jeweiligen Schulart/Schulstufe weiterhin anhand von BGBl. II Nr. 234/2011.

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

### Bildbasierte Aufgaben für noch nicht lese-/schreibkundige Kinder (1./2. Klasse Volksschule)

Für die 1./2. Schulstufe (Kinder können zu Schulbeginn meist noch nicht lesen/schreiben) gibt es
zwei zusätzliche, bildbasierte Aufgabentypen statt Lesetext-Aufgaben:

- **Ausmalbild**: ein Symbol aus einer kuratierten Strichzeichnungs-Bibliothek (`lib/icons.ts`,
  `public/icons/`) zum Ausmalen, mit kurzer vorlesbarer Anweisung.
- **Bildergeschichte**: eine Abfolge von 3–5 Symbolen, jeweils mit einem kurzen Vorlesetext für
  die Lehrkraft (das Kind hört zu und schaut sich die Bilder an, statt selbst zu lesen).

Die Symbol-Bibliothek umfasst neutrale, altersgerechte Motive (Halbmond, Stern, Moschee, Laterne,
Herz, Buch, Sonne, Wassertropfen, Familie, Gebetsteppich) – bewusst ohne Gottesname/Koran-Text,
aus demselben Grund wie beim Musterwort. Die KI wählt bei der Generierung ausschließlich aus dieser
festen Liste, wird bei dieser Schulstufe zu überwiegend bildbasierten Aufgaben angeleitet und die
Verifikation prüft das gegen. Im Erstellen-Formular gibt es dafür eine Empfehlung samt
Schnellauswahl, sobald „1./2. Klasse Volksschule“ als Schulstufe gewählt ist.

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
  - **Sterne**: achtzackiger Stern mit innerem Kern, ineinandergreifende Rauten-/Vieleck-Formen.
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

## Arbeitsblätter verwalten

Auf der Übersichtsseite lässt sich jedes Arbeitsblatt einzeln löschen (Papierkorb-Symbol) oder
über „Alle löschen" der komplette Bestand auf einmal entfernen - jeweils mit Sicherheitsabfrage,
da das Löschen unwiderruflich ist. Auch auf der Detailseite eines Arbeitsblatts gibt es einen
„Löschen"-Button.

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

## Deployment (Vercel)

1. Projekt in Vercel aus diesem GitHub-Repo importieren.
2. Im Tab **Storage** eine Postgres-Datenbank anlegen (setzt `DATABASE_URL` automatisch).
3. Unter **Settings → Environment Variables** `ANTHROPIC_API_KEY` eintragen.
4. Deployen – der Build-Schritt (`prisma migrate deploy && next build`) legt das Datenbankschema
   automatisch an.

SQLite (lokale Datei) funktioniert nicht auf Vercel, da dort keine dauerhafte Festplatte zur
Verfügung steht – deshalb Postgres statt SQLite.

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
