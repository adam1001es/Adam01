-- CreateTable
CREATE TABLE "Jahresplan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variante" TEXT NOT NULL,
    "gruppe" TEXT NOT NULL,
    "erstelltVon" TEXT,
    "bemerkungenGruppe" TEXT,
    "speziellerFokus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jahresplan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JahresplanWoche" (
    "id" TEXT NOT NULL,
    "jahresplanId" TEXT NOT NULL,
    "nummer" INTEGER NOT NULL,
    "wochenthema" TEXT,
    "kompetenzen" TEXT,
    "notizen" TEXT,

    CONSTRAINT "JahresplanWoche_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Jahresplan_userId_idx" ON "Jahresplan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JahresplanWoche_jahresplanId_nummer_key" ON "JahresplanWoche"("jahresplanId", "nummer");

-- AddForeignKey
ALTER TABLE "Jahresplan" ADD CONSTRAINT "Jahresplan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JahresplanWoche" ADD CONSTRAINT "JahresplanWoche_jahresplanId_fkey" FOREIGN KEY ("jahresplanId") REFERENCES "Jahresplan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
