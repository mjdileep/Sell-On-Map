"use client";

import type { Rental as Ad } from "@/types/rental";
import AdTopSummary from "@/components/ads/shared/AdTopSummary";
import AdContactInfo from "@/components/ads/shared/AdContactInfo";
import AdListedFooter from "@/components/ads/shared/AdListedFooter";
import { unitNames } from "@/lib/unitNames";
import { pricePerPerch } from "@/lib/area";
import { formatCurrency } from "@/lib/currencyUtils";
import AdvertiserProfileCard from "@/components/ads/shared/AdvertiserProfileCard";

export default function FullDetail({ ad }: { ad: Ad }) {
  const details: any = (ad as any).details || {};
  const size = details?.size;
  const currency = (ad as any).currency || 'USD';
  const perPerchPrice = (size && size.value && size.unit)
    ? pricePerPerch(Number(ad.price), Number(size.value), String(size.unit) as any)
    : null;
  return (
    <>
      <AdTopSummary
        images={ad.photos as any}
        title={ad.title}
        description={ad.description}
        price={ad.price}
        currency={currency}
        priceSuffix={perPerchPrice ? `(${formatCurrency(perPerchPrice, currency)} per perch)` : undefined}
        priceClassName="text-blue-700"
        address={ad.address}
        lat={ad.lat}
        lng={ad.lng}
      />
      <div className="p-2 md:p-4 grid grid-cols-1 gap-2 text-sm text-gray-700">
        {details?.type && (
          <div className="flex gap-1">
            <span>🌱</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Type: </span>
              <span>{String(details.type.replace('-', ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))}</span>
            </div>
          </div>
        )}
        {size && size.value && size.unit && (
          <div className="flex gap-1">
            <span>📏</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Size: </span>
              <span>{size.value} {unitNames[size.unit as keyof typeof unitNames]}</span>
            </div>
          </div>
        )}
        {typeof details?.pricePerUnit !== 'undefined' && (
          <div className="flex gap-1">
            <span>💰</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Price/Unit: </span>
              <span>{details.pricePerUnit}</span>
            </div>
          </div>
        )}
        {details?.usage?.zoning && (
          <div className="flex gap-1">
            <span>📋</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Zoning: </span>
              <span>{details.usage.zoning}</span>
            </div>
          </div>
        )}
      </div>
      <div className="px-2 md:px-4 text-sm text-gray-700 space-y-1">
        {details?.extras?.developmentPotential && (
          <div className="flex gap-1">
            <span>🔨</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Development: </span>
              <span>{details.extras.developmentPotential}</span>
            </div>
          </div>
        )}
        {details?.extras?.accessUtilities && (
          <div className="flex gap-1">
            <span>🔧</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Access/Utilities: </span>
              <span>{details.extras.accessUtilities}</span>
            </div>
          </div>
        )}
        {details?.extras?.topographyAmenities && (
          <div className="flex gap-1">
            <span>⛰️</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Topography/Amenities: </span>
              <span>{details.extras.topographyAmenities}</span>
            </div>
          </div>
        )}
        <AdContactInfo adId={ad.id} adTitle={ad.title} shortCode={(ad as any).shortCode} contact={details?.extras?.contact as any} />
      </div>
      {(ad as any)?.userId ? (
        <div className="px-2 md:px-4 mt-3">
          <AdvertiserProfileCard userId={(ad as any).userId} />
        </div>
      ) : null}
      <div className="p-2 md:p-4 pb-0"> 
        <AdListedFooter createdAt={ad.createdAt} mode="inline" />
       </div>
    </>
  );
}
