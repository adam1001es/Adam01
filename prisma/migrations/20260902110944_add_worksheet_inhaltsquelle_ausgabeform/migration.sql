-- AlterTable
ALTER TABLE "Worksheet" ADD COLUMN     "ausgabeform" TEXT NOT NULL DEFAULT 'arbeitsblatt',
ADD COLUMN     "inhaltsquelle" TEXT NOT NULL DEFAULT 'frei';
