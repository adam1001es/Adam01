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
- Drei Layout-Vorlagen (Klassisch / Modern / Kompakt), je mit Schulname, Schriftgröße und
  „Lösungen separat“ konfigurierbar

## Erweiterungsideen

- Automatischer täglicher Lauf (Cron) statt manuellem Button, sobald gewünscht
- Foto-/Bild-Export der Vorschau
- Mehrere hinterlegte Bereiche/Themenlisten zur Rotation
