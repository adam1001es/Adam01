-- AlterTable
ALTER TABLE "Worksheet" ADD COLUMN     "oeffentlicherLinkToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Worksheet_oeffentlicherLinkToken_key" ON "Worksheet"("oeffentlicherLinkToken");
