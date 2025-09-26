"use client";

import { useMemo } from "react";
import type { Rental as Ad } from "@/types/rental";
import { resolveFullDetail } from "@/components/ads/resolver";
import AdTopSummary from "@/components/ads/shared/AdTopSummary";
import AdListedFooter from "@/components/ads/shared/AdListedFooter";

function FallbackFullDetail({ ad }: { ad: any }) {
  return (
    <>
      <AdTopSummary
        images={ad?.photos as any}
        title={ad?.title}
        description={ad?.description}
        price={ad?.price}
        currency={ad?.currency || "USD"}
        address={ad?.address}
        lat={ad?.lat}
        lng={ad?.lng}
      />
      <AdListedFooter createdAt={ad?.createdAt} />
    </>
  );
}

export default function FullDetailRenderer({ ad }: { ad: any }) {
  const category: string = String(ad?.category || "");
  const details = useMemo(() => {
    return (ad as any)?.landRentalDetail?.attributes
      || (ad as any)?.buildingRentalDetail?.attributes
      || (ad as any)?.rentalDetail?.attributes
      || (ad as any)?.landSaleDetail?.attributes
      || (ad as any)?.buildingSaleDetail?.attributes
      || (ad as any)?.details
      || {};
  }, [ad]);

  const Comp = resolveFullDetail(category);
  if (Comp) {
    return <Comp ad={{ ...(ad as any), details } as Ad} />;
  }
  return <FallbackFullDetail ad={{ ...(ad as any), details }} />;
}
