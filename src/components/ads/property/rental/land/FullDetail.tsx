"use client";

import type { Rental as Ad } from "@/types/rental";
import AdTopSummary from "@/components/ads/shared/AdTopSummary";
import AdContactInfo from "@/components/ads/shared/AdContactInfo";
import AdListedFooter from "@/components/ads/shared/AdListedFooter";
import { unitNames } from "@/lib/unitNames";

export default function FullDetail({ ad }: { ad: Ad }) {
  const details: any = (ad as any)?.details || {};
  return (
    <>
      <AdTopSummary
        images={ad.photos as any}
        title={ad.title}
        description={ad.description}
        price={ad.price}
        currency={(ad as any).currency || 'USD'}
        priceSuffix={details?.billingPeriod ? `/${details.billingPeriod}` : '/month'}
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
        {details?.pricePerUnit?.value && details?.pricePerUnit?.unit && (
          <div className="flex gap-1">
            <span>💰</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Price/Unit: </span>
              <span>{details.pricePerUnit.value} per {details.pricePerUnit.unit}</span>
            </div>
          </div>
        )}
        {details?.size?.value && details?.size?.unit && (
          <div className="flex gap-1">
            <span>📏</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Size: </span>
              <span>{details.size.value} {unitNames[details.size.unit as keyof typeof unitNames]}</span>
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
        {details?.structure?.floors && (
          <div className="flex gap-1">
            <span>🏢</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Floors: </span>
              <span>{details.structure.floors}</span>
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
        {details?.leaseTerms?.advancePayment?.value && (
          <div className="flex gap-1">
            <span>💰</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Advance: </span>
              <span>{details.leaseTerms.advancePayment.value} {details.leaseTerms.advancePayment.unit}</span>
            </div>
          </div>
        )}
        {details?.leaseTerms?.minLeaseDuration?.value && (
          <div className="flex gap-1">
            <span>⏰</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Min Lease: </span>
              <span>{details.leaseTerms.minLeaseDuration.value} {details.leaseTerms.minLeaseDuration.unit}</span>
            </div>
          </div>
        )}
        {details?.leaseTerms?.maxLeaseDuration?.value && (
          <div className="flex gap-1">
            <span>⏰</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Max Lease: </span>
              <span>{details.leaseTerms.maxLeaseDuration.value} {details.leaseTerms.maxLeaseDuration.unit}</span>
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
        {details?.extras?.restrictionsAmenities && (
          <div className="flex gap-1">
            <span>📋</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Restrictions/Amenities: </span>
              <span>{details.extras.restrictionsAmenities}</span>
            </div>
          </div>
        )}
        {details?.extras?.amenitiesUtilities && (
          <div className="flex gap-1">
            <span>🔧</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Amenities/Utilities: </span>
              <span>{details.extras.amenitiesUtilities}</span>
            </div>
          </div>
        )}
        {details?.extras?.leaseType && (
          <div className="flex gap-1">
            <span>🏠</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Lease Type: </span>
              <span>{details.extras.leaseType}</span>
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
