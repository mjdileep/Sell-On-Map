"use client";

import type { Rental as Ad } from "@/types/rental";
import AdTopSummary from "@/components/ads/shared/AdTopSummary";
import AdListedFooter from "@/components/ads/shared/AdListedFooter";

export default function FullDetail({ ad }: { ad: Ad }) {
  return (
    <>
      <AdTopSummary
        images={ad.photos as any}
        title={ad.title}
        description={ad.description}
        price={ad.price}
        currency={(ad as any).currency || 'USD'}
        priceClassName="text-pink-700"
        address={ad.address}
        lat={ad.lat}
        lng={ad.lng}
      />
      <AdListedFooter createdAt={ad.createdAt} />
    </>
  );
}
