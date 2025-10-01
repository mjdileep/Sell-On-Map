"use client";

import type { Rental as Ad } from "@/types/rental";
import { unitNames } from "@/lib/unitNames";
import AdTopSummary from "@/components/ads/shared/AdTopSummary";
import AdContactInfo from "@/components/ads/shared/AdContactInfo";
import AdListedFooter from "@/components/ads/shared/AdListedFooter";

export default function FullDetail({ ad }: { ad: Ad }) {
  const details: any = (ad as any).details || {};
  const fa = details?.floorArea;
  const ls = details?.landSize;
  return (
    <>
      <AdTopSummary
        images={ad.photos as any}
        title={ad.title}
        description={ad.description}
        price={ad.price}
        currency={(ad as any).currency || 'USD'}
        priceClassName="text-indigo-700"
        address={ad.address}
        lat={ad.lat}
        lng={ad.lng}
      />
      <div className="p-2 md:p-4 grid grid-cols-1 gap-2 text-sm text-gray-700">
        {details?.type && (
          <div className="flex gap-1">
            <span>🏠</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Type: </span>
              <span>{String(details.type.replace('-', ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))}</span>
            </div>
          </div>
        )}
        {fa && fa.value && fa.unit && (
          <div className="flex gap-1">
            <span>📐</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Floor Area: </span>
              <span>{fa.value} {unitNames[fa.unit as keyof typeof unitNames]}</span>
            </div>
          </div>
        )}
        {ls && ls.value && ls.unit && (
          <div className="flex gap-1">
            <span>📏</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Land Size: </span>
              <span>{ls.value} {unitNames[ls.unit as keyof typeof unitNames]}</span>
            </div>
          </div>
        )}
        {details?.structure?.floors && (
          <div className="flex gap-1">
            <span>🏢</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Floors: </span>
              <span>{details.structure.floors}</span>
            </div>
          </div>
        )}
        {details?.structure?.buildYear && (
          <div className="flex gap-1">
            <span>📅</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Build Year: </span>
              <span>{details.structure.buildYear}</span>
            </div>
          </div>
        )}
        {details?.structure?.condition && (
          <div className="flex gap-1">
            <span>🔧</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Condition: </span>
              <span>{details.structure.condition}</span>
            </div>
          </div>
        )}
        {details?.rooms?.bedrooms && (
          <div className="flex gap-1">
            <span>🛏️</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Bedrooms: </span>
              <span>{details.rooms.bedrooms}</span>
            </div>
          </div>
        )}
        {details?.rooms?.bathrooms && (
          <div className="flex gap-1">
            <span>🚿</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Bathrooms: </span>
              <span>{details.rooms.bathrooms}</span>
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
        {details?.parking && (
          <div className="flex gap-1">
            <span>🚗</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Parking: </span>
              <span>{details.parking}</span>
            </div>
          </div>
        )}
      </div>
      <div className="px-2 md:px-4 text-sm text-gray-700 space-y-1">
        {details?.extras?.amenitiesUtilities && (
          <div className="flex gap-1">
            <span>🔧</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Amenities/Utilities: </span>
              <span>{details.extras.amenitiesUtilities}</span>
            </div>
          </div>
        )}
        {details?.extras?.investmentPotential && (
          <div className="flex gap-1">
            <span>📈</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Investment: </span>
              <span>{details.extras.investmentPotential}</span>
            </div>
          </div>
        )}
        <AdContactInfo adId={ad.id} adTitle={ad.title} shortCode={(ad as any).shortCode} contact={details?.extras?.contact as any} />
      </div>
      <div className="p-2 md:p-4 pb-0"> 
        <AdListedFooter createdAt={ad.createdAt} mode="inline" />
       </div>
    </>
  );
}
