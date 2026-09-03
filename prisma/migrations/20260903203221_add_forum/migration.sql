-- AlterTable
ALTER TABLE "User" ADD COLUMN     "forumGesperrt" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ForumThread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "inhalt" TEXT NOT NULL,
    "kategorie" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumAntwort" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inhalt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumAntwort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumChatNachricht" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inhalt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumChatNachricht_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumMeldung" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zielTyp" TEXT NOT NULL,
    "zielId" TEXT NOT NULL,
    "gemeldeterUserId" TEXT NOT NULL,
    "inhaltSnapshot" TEXT NOT NULL,
    "grund" TEXT,
    "bearbeitet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumMeldung_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumChatNachricht_createdAt_idx" ON "ForumChatNachricht"("createdAt");

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumAntwort" ADD CONSTRAINT "ForumAntwort_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumAntwort" ADD CONSTRAINT "ForumAntwort_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumChatNachricht" ADD CONSTRAINT "ForumChatNachricht_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumMeldung" ADD CONSTRAINT "ForumMeldung_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
