-- CreateTable
CREATE TABLE "SiteContent" (
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("key")
);
