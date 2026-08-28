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

## Layout-Extras

- **Islamisches Datum**: zeigt im Kopfbereich zusätzlich zum gregorianischen das rechnerische
  Hijri-Datum (tabellarischer Kalender) an, inkl. Hinweis auf mögliche ±1-Tag-Abweichung durch
  Mondsichtung (`lib/hijri.ts`). Optional abschaltbar.
- **Dezentes Musterelement**: ein minimaler, rein rechnerisch erzeugter achtzackiger Stern
  (klassisches geometrisches Grundmotiv) als Zierstreifen im Kopfbereich, in Web und PDF als SVG,
  in Word als vereinfachte Textzeile (`lib/pattern.ts`). Optional abschaltbar.

## Setup

```bash
npm install
cp .env.example .env   # ANTHROPIC_API_KEY eintragen
npx prisma migrate deploy
npm run dev
```

Danach [http://localhost:3000](http://localhost:3000) öffnen.

### Umgebungsvariablen (`.env`)

- `DATABASE_URL` – SQLite-Datei, standardmäßig `file:./dev.db` (relativ zu `prisma/`)
- `ANTHROPIC_API_KEY` – dein Anthropic API-Key

## Tech-Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (Verlauf aller generierten Arbeitsblätter)
- `@anthropic-ai/sdk` (Modell: `claude-opus-5`) für Generierung + Verifikation
- `@react-pdf/renderer` für PDF-Export, `docx` für Word-Export
- Drei Layout-Vorlagen (Klassisch / Modern / Kompakt), je mit Schulname, Schriftgröße,
  „Lösungen separat“, islamischem Datum und Musterstreifen konfigurierbar

## Erweiterungsideen

- Automatischer täglicher Lauf (Cron) statt manuellem Button, sobald gewünscht
- Foto-/Bild-Export der Vorschau
- Mehrere hinterlegte Bereiche/Themenlisten zur Rotation
