-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwortResetToken" TEXT,
ADD COLUMN     "passwortResetTokenAblauf" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_passwortResetToken_key" ON "User"("passwortResetToken");

