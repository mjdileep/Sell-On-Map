-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "adActiveDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "maxActiveAds" INTEGER NOT NULL DEFAULT 1;

-- RenameIndex
ALTER INDEX "public"."Ad_moderation_isActive_idx" RENAME TO "Ad_moderationStatus_isActive_idx";
