-- CreateTable
CREATE TABLE "AufgabeErgaenzenUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "anzahl" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AufgabeErgaenzenUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AufgabeErgaenzenUsage_userId_tag_key" ON "AufgabeErgaenzenUsage"("userId", "tag");

-- AddForeignKey
ALTER TABLE "AufgabeErgaenzenUsage" ADD CONSTRAINT "AufgabeErgaenzenUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
