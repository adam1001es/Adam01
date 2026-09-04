-- CreateTable
CREATE TABLE "StundenplanEintrag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wochentag" INTEGER NOT NULL,
    "beginn" TEXT NOT NULL,
    "ende" TEXT NOT NULL,
    "schule" TEXT,
    "klasse" TEXT,
    "schuelerangabe" TEXT,
    "istPause" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StundenplanEintrag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StundenplanEintrag_userId_wochentag_idx" ON "StundenplanEintrag"("userId", "wochentag");

-- AddForeignKey
ALTER TABLE "StundenplanEintrag" ADD CONSTRAINT "StundenplanEintrag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
