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
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
        {details?.type && (<div><span className="text-gray-500">Type:</span> {String(details.type.replace('-', ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))}</div>)}
        {details?.floorArea?.value && details?.floorArea?.unit && (<div><span className="text-gray-500">Floor Area:</span> {details.floorArea.value} {unitNames[details.floorArea.unit as keyof typeof unitNames]}</div>)}
        {details?.landSize?.value && details?.landSize?.unit && (<div><span className="text-gray-500">Land Size:</span> {details.landSize.value} {unitNames[details.landSize.unit as keyof typeof unitNames]}</div>)}
        {details?.usage?.zoning && (<div><span className="text-gray-500">Zoning:</span> {details.usage.zoning}</div>)}
        {details?.structure?.floors && (<div><span className="text-gray-500">Floors:</span> {details.structure.floors}</div>)}
        {details?.structure?.buildYear && (<div><span className="text-gray-500">Build Year:</span> {details.structure.buildYear}</div>)}
        {details?.structure?.condition && (<div><span className="text-gray-500">Condition:</span> {details.structure.condition}</div>)}
        {details?.rooms?.bedrooms && (<div><span className="text-gray-500">Bedrooms:</span> {details.rooms.bedrooms}</div>)}
        {details?.rooms?.bathrooms && (<div><span className="text-gray-500">Bathrooms:</span> {details.rooms.bathrooms}</div>)}
        {details?.parking && (<div><span className="text-gray-500">Parking:</span> {details.parking}</div>)}
      </div>
      <div className="text-sm text-gray-700 space-y-1">
        {details?.leaseTerms?.advancePayment?.value && (<div><span className="text-gray-500">Advance:</span> {details.leaseTerms.advancePayment.value} {details.leaseTerms.advancePayment.unit}</div>)}
        {details?.leaseTerms?.minLeaseDuration?.value && (<div><span className="text-gray-500">Min Lease:</span> {details.leaseTerms.minLeaseDuration.value} {details.leaseTerms.minLeaseDuration.unit}</div>)}
        {details?.leaseTerms?.maxLeaseDuration?.value && (<div><span className="text-gray-500">Max Lease:</span> {details.leaseTerms.maxLeaseDuration.value} {details.leaseTerms.maxLeaseDuration.unit}</div>)}
        {details?.extras?.amenitiesUtilities && (<div><span className="text-gray-500">Amenities/Utilities:</span> {details.extras.amenitiesUtilities}</div>)}
        {details?.extras?.leaseType && (<div><span className="text-gray-500">Lease Type:</span> {details.extras.leaseType}</div>)}
        <AdContactInfo contact={details?.extras?.contact as any} />
      </div>
      <AdListedFooter createdAt={ad.createdAt} mode="inline" />
    </>
  );
}
