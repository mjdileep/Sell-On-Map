-- Add admin flag and moderation workflow

-- Create enum type for ad moderation status
DO $$ BEGIN
  CREATE TYPE "AdModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add isAdmin to users
ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Add moderation columns to ads
ALTER TABLE "public"."Ad"
  ADD COLUMN IF NOT EXISTS "moderationStatus" "AdModerationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "rejectReason" TEXT;

-- Update defaults and nullability for activation/expiry
ALTER TABLE "public"."Ad"
  ALTER COLUMN "isActive" SET DEFAULT false,
  ALTER COLUMN "activatedAt" DROP NOT NULL,
  ALTER COLUMN "activatedAt" DROP DEFAULT,
  ALTER COLUMN "expiresAt" DROP NOT NULL;

-- Existing data migration: mark currently active ads as approved
UPDATE "public"."Ad"
  SET "moderationStatus" = 'APPROVED'
  WHERE "isActive" = true;

-- Indexes to support moderation queries
CREATE INDEX IF NOT EXISTS "Ad_moderation_isActive_idx" ON "public"."Ad"("moderationStatus", "isActive");


