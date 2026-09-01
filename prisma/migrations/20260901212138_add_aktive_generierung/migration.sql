-- CreateTable
CREATE TABLE "AktiveGenerierung" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AktiveGenerierung_pkey" PRIMARY KEY ("id")
);
