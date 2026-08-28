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
  Mondsichtung (`lib/hijri.ts`). Optional abschaltbar.
- **Eckornamente statt Streifen**: nur in den vier (bzw. oberen zwei) Ecken je Seite ein
  schlichter, zweizeiliger Kufi-Winkel (`lib/cornerOrnament.ts`) - wie klassische Buch-/
  Zertifikatsränder, aber bewusst ganz minimal (ein Gold-Ton, kein Stern- oder Rankenmotiv, keine
  Fläche in der Mitte), damit der Kopfbereich ruhig bleibt. Ohne Gottesname/Koran-Vers (gleiche
  Begründung wie zuvor: Arbeitsblätter landen im Schulalltag auch mal auf dem Boden). In Web/PDF
  als Vektor gerendert (in PDF pageweit über `floating`-Positionierung); in Word über zwei
  einmalig serverseitig gerenderte PNGs (`public/patterns/ecke-gold.png` + `ecke-gold-mirror.png`,
  normale und gespiegelte Variante), an den Seitenrand-Ecken verankert. Optional abschaltbar.

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
- `@anthropic-ai/sdk` (Modell: `claude-opus-5`) für Generierung + Verifikation
- `@react-pdf/renderer` für PDF-Export, `docx` für Word-Export
- Drei Layout-Vorlagen (Klassisch / Modern / Kompakt), je mit Schulname, Schriftgröße,
  „Lösungen separat“, islamischem Datum und Musterstreifen konfigurierbar

## Erweiterungsideen

- Automatischer täglicher Lauf (Cron) statt manuellem Button, sobald gewünscht
- Foto-/Bild-Export der Vorschau
- Mehrere hinterlegte Bereiche/Themenlisten zur Rotation
