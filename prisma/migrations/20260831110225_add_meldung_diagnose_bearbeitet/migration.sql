-- AlterTable
ALTER TABLE "Meldung" ADD COLUMN     "bearbeitet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "diagnose" TEXT;

-- Datenmigration: vor diesem Feature wurde "status" manuell zwischen "offen"/"bearbeitet"
-- umgeschaltet (siehe alte MeldungStatusButton-Logik) - für bereits bestehende, damals manuell
-- als "bearbeitet" markierte Meldungen bleibt das erhalten (neues "bearbeitet"-Flag), der Status
-- selbst wird auf "nicht_behebbar" zurückgesetzt (kein automatisches Analyse-Ergebnis liegt für
-- sie vor, sie wurden ja bereits von Hand geprüft/erledigt).
UPDATE "Meldung" SET "bearbeitet" = true, "status" = 'nicht_behebbar' WHERE "status" = 'bearbeitet';
