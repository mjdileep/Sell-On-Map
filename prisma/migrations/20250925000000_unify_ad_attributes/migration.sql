-- Unify ad attributes into Ad.attributes and drop leaf tables
-- Safe operations: add column if not exists; copy data where possible; drop tables if exist

-- Add attributes column to Ad
ALTER TABLE "public"."Ad"
  ADD COLUMN IF NOT EXISTS "attributes" JSONB;

-- Backfill: if any leaf tables exist, copy attributes into Ad.attributes where null
DO $$
BEGIN
  -- RentalDetail
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'RentalDetail') THEN
    UPDATE "public"."Ad" a
    SET attributes = COALESCE(a.attributes, r."attributes")
    FROM "public"."RentalDetail" r
    WHERE r."adId" = a."id";
  END IF;
  -- LandRentalDetail
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'LandRentalDetail') THEN
    UPDATE "public"."Ad" a
    SET attributes = COALESCE(a.attributes, lrd."attributes")
    FROM "public"."LandRentalDetail" lrd
    WHERE lrd."adId" = a."id";
  END IF;
  -- BuildingRentalDetail
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'BuildingRentalDetail') THEN
    UPDATE "public"."Ad" a
    SET attributes = COALESCE(a.attributes, brd."attributes")
    FROM "public"."BuildingRentalDetail" brd
    WHERE brd."adId" = a."id";
  END IF;
  -- LandSaleDetail
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'LandSaleDetail') THEN
    UPDATE "public"."Ad" a
    SET attributes = COALESCE(a.attributes, lsd."attributes")
    FROM "public"."LandSaleDetail" lsd
    WHERE lsd."adId" = a."id";
  END IF;
  -- BuildingSaleDetail
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'BuildingSaleDetail') THEN
    UPDATE "public"."Ad" a
    SET attributes = COALESCE(a.attributes, bsd."attributes")
    FROM "public"."BuildingSaleDetail" bsd
    WHERE bsd."adId" = a."id";
  END IF;
  -- ClothingDetail
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ClothingDetail') THEN
    UPDATE "public"."Ad" a
    SET attributes = COALESCE(a.attributes, cd."attributes")
    FROM "public"."ClothingDetail" cd
    WHERE cd."adId" = a."id";
  END IF;
END$$;

-- Drop leaf tables if they exist
DROP TABLE IF EXISTS "public"."RentalDetail" CASCADE;
DROP TABLE IF EXISTS "public"."LandRentalDetail" CASCADE;
DROP TABLE IF EXISTS "public"."BuildingRentalDetail" CASCADE;
DROP TABLE IF EXISTS "public"."LandSaleDetail" CASCADE;
DROP TABLE IF EXISTS "public"."BuildingSaleDetail" CASCADE;
DROP TABLE IF EXISTS "public"."ClothingDetail" CASCADE;
