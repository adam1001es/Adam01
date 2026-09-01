-- AlterTable
ALTER TABLE "Worksheet" ADD COLUMN     "istPruefung" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "punkteGesamt" INTEGER;

-- CreateTable
CREATE TABLE "Klasse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schulstufe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Klasse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schueler" (
    "id" TEXT NOT NULL,
    "klasseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Schueler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zuweisung" (
    "id" TEXT NOT NULL,
    "klasseId" TEXT NOT NULL,
    "worksheetId" TEXT,
    "titel" TEXT NOT NULL,
    "themenbereich" TEXT NOT NULL,
    "istPruefung" BOOLEAN NOT NULL DEFAULT false,
    "punkteGesamt" INTEGER,
    "datum" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zuweisung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ergebnis" (
    "id" TEXT NOT NULL,
    "zuweisungId" TEXT NOT NULL,
    "schuelerId" TEXT NOT NULL,
    "prozent" DOUBLE PRECISION,
    "notiz" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ergebnis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ergebnis_zuweisungId_schuelerId_key" ON "Ergebnis"("zuweisungId", "schuelerId");

-- AddForeignKey
ALTER TABLE "Klasse" ADD CONSTRAINT "Klasse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schueler" ADD CONSTRAINT "Schueler_klasseId_fkey" FOREIGN KEY ("klasseId") REFERENCES "Klasse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zuweisung" ADD CONSTRAINT "Zuweisung_klasseId_fkey" FOREIGN KEY ("klasseId") REFERENCES "Klasse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ergebnis" ADD CONSTRAINT "Ergebnis_zuweisungId_fkey" FOREIGN KEY ("zuweisungId") REFERENCES "Zuweisung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ergebnis" ADD CONSTRAINT "Ergebnis_schuelerId_fkey" FOREIGN KEY ("schuelerId") REFERENCES "Schueler"("id") ON DELETE CASCADE ON UPDATE CASCADE;
