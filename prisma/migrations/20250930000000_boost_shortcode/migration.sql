-- AlterTable: add boost and shortCode to Ad
ALTER TABLE "public"."Ad"
  ADD COLUMN IF NOT EXISTS "boost" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "shortCode" TEXT;

-- Create unique index for shortCode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Ad_shortCode_key'
  ) THEN
    CREATE UNIQUE INDEX "Ad_shortCode_key" ON "public"."Ad" ("shortCode");
  END IF;
END $$;


