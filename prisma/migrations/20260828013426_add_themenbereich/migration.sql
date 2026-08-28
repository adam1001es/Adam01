-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Worksheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bereich" TEXT NOT NULL,
    "thema" TEXT NOT NULL,
    "schulstufe" TEXT NOT NULL,
    "themenbereich" TEXT NOT NULL DEFAULT 'gemischt',
    "template" TEXT NOT NULL,
    "layoutConfig" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "verification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'entwurf',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Worksheet" ("bereich", "contentJson", "createdAt", "id", "layoutConfig", "schulstufe", "status", "template", "thema", "verification") SELECT "bereich", "contentJson", "createdAt", "id", "layoutConfig", "schulstufe", "status", "template", "thema", "verification" FROM "Worksheet";
DROP TABLE "Worksheet";
ALTER TABLE "new_Worksheet" RENAME TO "Worksheet";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
