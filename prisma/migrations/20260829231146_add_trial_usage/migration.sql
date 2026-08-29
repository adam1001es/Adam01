-- CreateTable
CREATE TABLE "TrialUsage" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "monat" TEXT NOT NULL,
    "anzahl" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialUsage_ip_monat_key" ON "TrialUsage"("ip", "monat");
