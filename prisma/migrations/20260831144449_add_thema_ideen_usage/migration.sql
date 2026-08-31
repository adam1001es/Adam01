-- CreateTable
CREATE TABLE "ThemaIdeenUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "anzahl" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemaIdeenUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThemaIdeenUsage_userId_tag_key" ON "ThemaIdeenUsage"("userId", "tag");

-- AddForeignKey
ALTER TABLE "ThemaIdeenUsage" ADD CONSTRAINT "ThemaIdeenUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
