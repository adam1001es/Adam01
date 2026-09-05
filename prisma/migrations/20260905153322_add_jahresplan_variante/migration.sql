-- CreateTable
CREATE TABLE "JahresplanVariante" (
    "id" TEXT NOT NULL,
    "varianteId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "schuljahr" TEXT NOT NULL,
    "wochenJson" TEXT NOT NULL,
    "hochgeladenVonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JahresplanVariante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JahresplanVariante_varianteId_key" ON "JahresplanVariante"("varianteId");

-- AddForeignKey
ALTER TABLE "JahresplanVariante" ADD CONSTRAINT "JahresplanVariante_hochgeladenVonId_fkey" FOREIGN KEY ("hochgeladenVonId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
