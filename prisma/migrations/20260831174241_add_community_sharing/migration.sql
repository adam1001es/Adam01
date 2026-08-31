-- AlterTable
ALTER TABLE "Worksheet" ADD COLUMN     "geteilt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "geteiltAm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CommunityFavorit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "worksheetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityFavorit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityFavorit_userId_worksheetId_key" ON "CommunityFavorit"("userId", "worksheetId");

-- AddForeignKey
ALTER TABLE "CommunityFavorit" ADD CONSTRAINT "CommunityFavorit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFavorit" ADD CONSTRAINT "CommunityFavorit_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "Worksheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
