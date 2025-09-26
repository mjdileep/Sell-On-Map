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
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
        {details?.type && (<div><span className="text-gray-500">Type:</span> {String(details.type.replace('-', ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))}</div>)}
        {fa && fa.value && fa.unit && (<div><span className="text-gray-500">Floor Area:</span> {fa.value} {unitNames[fa.unit as keyof typeof unitNames]}</div>)}
        {ls && ls.value && ls.unit && (<div><span className="text-gray-500">Land Size:</span> {ls.value} {unitNames[ls.unit as keyof typeof unitNames]}</div>)}
        {details?.structure?.floors && (<div><span className="text-gray-500">Floors:</span> {details.structure.floors}</div>)}
        {details?.structure?.buildYear && (<div><span className="text-gray-500">Build Year:</span> {details.structure.buildYear}</div>)}
        {details?.structure?.condition && (<div><span className="text-gray-500">Condition:</span> {details.structure.condition}</div>)}
        {details?.rooms?.bedrooms && (<div><span className="text-gray-500">Bedrooms:</span> {details.rooms.bedrooms}</div>)}
        {details?.rooms?.bathrooms && (<div><span className="text-gray-500">Bathrooms:</span> {details.rooms.bathrooms}</div>)}
        {details?.usage?.zoning && (<div><span className="text-gray-500">Zoning:</span> {details.usage.zoning}</div>)}
        {details?.parking && (<div><span className="text-gray-500">Parking:</span> {details.parking}</div>)}
      </div>
      <div className="text-sm text-gray-700 space-y-1">
        {details?.extras?.amenitiesUtilities && (<div><span className="text-gray-500">Amenities/Utilities:</span> {details.extras.amenitiesUtilities}</div>)}
        {details?.extras?.investmentPotential && (<div><span className="text-gray-500">Investment:</span> {details.extras.investmentPotential}</div>)}
        <AdContactInfo contact={details?.extras?.contact as any} />
      </div>
      <AdListedFooter createdAt={ad.createdAt} />
    </>
  );
}
