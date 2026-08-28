-- CreateTable
CREATE TABLE "Worksheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bereich" TEXT NOT NULL,
    "thema" TEXT NOT NULL,
    "schulstufe" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "layoutConfig" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "verification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'entwurf',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
