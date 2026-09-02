-- CreateTable
CREATE TABLE "GenerierungsAnfrage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "worksheetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerierungsAnfrage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenerierungsAnfrage_userId_requestHash_idx" ON "GenerierungsAnfrage"("userId", "requestHash");
