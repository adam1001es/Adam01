-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarEmoji" TEXT NOT NULL DEFAULT '🧑‍🏫',
ADD COLUMN     "avatarFarbe" TEXT NOT NULL DEFAULT '#0f766e',
ADD COLUMN     "unterrichtsStufen" TEXT[] DEFAULT ARRAY[]::TEXT[];
