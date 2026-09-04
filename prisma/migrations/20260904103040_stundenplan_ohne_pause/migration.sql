/*
  Warnings:

  - You are about to drop the column `istPause` on the `StundenplanEintrag` table. All the data in the column will be lost.
  - Made the column `schule` on table `StundenplanEintrag` required. This step will fail if there are existing NULL values in that column.
  - Made the column `klasse` on table `StundenplanEintrag` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "StundenplanEintrag" DROP COLUMN "istPause",
ALTER COLUMN "schule" SET NOT NULL,
ALTER COLUMN "klasse" SET NOT NULL;
