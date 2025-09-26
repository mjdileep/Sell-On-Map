-- CreateTable
CREATE TABLE "public"."RentalDetail" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LandSaleDetail" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandSaleDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BuildingSaleDetail" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingSaleDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClothingDetail" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClothingDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RentalDetail_adId_key" ON "public"."RentalDetail"("adId");

-- CreateIndex
CREATE UNIQUE INDEX "LandSaleDetail_adId_key" ON "public"."LandSaleDetail"("adId");

-- CreateIndex
CREATE UNIQUE INDEX "BuildingSaleDetail_adId_key" ON "public"."BuildingSaleDetail"("adId");

-- CreateIndex
CREATE UNIQUE INDEX "ClothingDetail_adId_key" ON "public"."ClothingDetail"("adId");

-- AddForeignKey
ALTER TABLE "public"."RentalDetail" ADD CONSTRAINT "RentalDetail_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LandSaleDetail" ADD CONSTRAINT "LandSaleDetail_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuildingSaleDetail" ADD CONSTRAINT "BuildingSaleDetail_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClothingDetail" ADD CONSTRAINT "ClothingDetail_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
