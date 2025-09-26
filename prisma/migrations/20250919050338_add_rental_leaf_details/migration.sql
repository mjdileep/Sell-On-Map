-- CreateTable
CREATE TABLE "public"."LandRentalDetail" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandRentalDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BuildingRentalDetail" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingRentalDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandRentalDetail_adId_key" ON "public"."LandRentalDetail"("adId");

-- CreateIndex
CREATE UNIQUE INDEX "BuildingRentalDetail_adId_key" ON "public"."BuildingRentalDetail"("adId");

-- AddForeignKey
ALTER TABLE "public"."LandRentalDetail" ADD CONSTRAINT "LandRentalDetail_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuildingRentalDetail" ADD CONSTRAINT "BuildingRentalDetail_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
