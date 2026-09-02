-- CreateTable
CREATE TABLE "WissensEintrag" (
    "id" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "themenbereich" TEXT NOT NULL,
    "schulstufeCluster" TEXT,
    "inhalt" TEXT NOT NULL,
    "rechercheNotiz" TEXT,
    "quellWorksheetIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'entwurf',
    "geprueftAm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WissensEintrag_pkey" PRIMARY KEY ("id")
);
