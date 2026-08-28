-- CreateTable
CREATE TABLE "Worksheet" (
    "id" TEXT NOT NULL,
    "bereich" TEXT NOT NULL,
    "thema" TEXT NOT NULL,
    "schulstufe" TEXT NOT NULL,
    "themenbereich" TEXT NOT NULL DEFAULT 'gemischt',
    "template" TEXT NOT NULL,
    "layoutConfig" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "verification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'entwurf',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Worksheet_pkey" PRIMARY KEY ("id")
);
