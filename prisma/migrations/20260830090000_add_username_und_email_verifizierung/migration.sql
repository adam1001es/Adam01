-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiziert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "verifizierungsToken" TEXT,
ADD COLUMN     "verifizierungsTokenAblauf" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_verifizierungsToken_key" ON "User"("verifizierungsToken");

-- Bestandskonten (vor Einführung der E-Mail-Verifizierung registriert) gelten als bereits
-- verifiziert, damit niemand durch dieses Feature ausgesperrt wird - nur künftige
-- Neuregistrierungen (DEFAULT false oben) müssen den Link aus der Mail bestätigen.
UPDATE "User" SET "emailVerifiziert" = true;
