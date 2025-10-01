-- CreateTable
CREATE TABLE "public"."PageView" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "clientId" TEXT,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "country" TEXT,
    "city" TEXT,
    "hostname" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "screen" JSONB,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "clientId" TEXT,
    "adId" TEXT,
    "path" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageView_occurredAt_idx" ON "public"."PageView"("occurredAt");

-- CreateIndex
CREATE INDEX "PageView_country_occurredAt_idx" ON "public"."PageView"("country", "occurredAt");

-- CreateIndex
CREATE INDEX "PageView_path_occurredAt_idx" ON "public"."PageView"("path", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_occurredAt_idx" ON "public"."AnalyticsEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_occurredAt_idx" ON "public"."AnalyticsEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_country_occurredAt_idx" ON "public"."AnalyticsEvent"("country", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_adId_eventType_occurredAt_idx" ON "public"."AnalyticsEvent"("adId", "eventType", "occurredAt");

-- AddForeignKey
ALTER TABLE "public"."PageView" ADD CONSTRAINT "PageView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
