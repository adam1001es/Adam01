-- CreateTable
CREATE TABLE "Meldung" (
    "id" TEXT NOT NULL,
    "worksheetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kategorie" TEXT NOT NULL,
    "beschreibung" TEXT,
    "status" TEXT NOT NULL DEFAULT 'offen',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meldung_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Meldung" ADD CONSTRAINT "Meldung_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "Worksheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meldung" ADD CONSTRAINT "Meldung_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
