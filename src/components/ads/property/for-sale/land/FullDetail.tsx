"use client";

import type { Rental as Ad } from "@/types/rental";
import AdTopSummary from "@/components/ads/shared/AdTopSummary";
import AdContactInfo from "@/components/ads/shared/AdContactInfo";
import AdListedFooter from "@/components/ads/shared/AdListedFooter";
import { unitNames } from "@/lib/unitNames";
import { pricePerPerch } from "@/lib/area";
import { formatCurrency } from "@/lib/currencyUtils";

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
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
        {details?.type && (<div><span className="text-gray-500">Type:</span> {String(details.type.replace('-', ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))}</div>)}
        {size && size.value && size.unit && (<div><span className="text-gray-500">Size:</span> {size.value} {unitNames[size.unit as keyof typeof unitNames]}</div>)}
        {typeof details?.pricePerUnit !== 'undefined' && (<div><span className="text-gray-500">Price/Unit:</span> {details.pricePerUnit}</div>)}
        {details?.usage?.zoning && (<div><span className="text-gray-500">Zoning:</span> {details.usage.zoning}</div>)}
      </div>
      <div className="text-sm text-gray-700 space-y-1">
        {details?.extras?.developmentPotential && (<div><span className="text-gray-500">Development:</span> {details.extras.developmentPotential}</div>)}
        {details?.extras?.accessUtilities && (<div><span className="text-gray-500">Access/Utilities:</span> {details.extras.accessUtilities}</div>)}
        {details?.extras?.topographyAmenities && (<div><span className="text-gray-500">Topography/Amenities:</span> {details.extras.topographyAmenities}</div>)}
        <AdContactInfo contact={details?.extras?.contact as any} />
      </div>
      <AdListedFooter createdAt={ad.createdAt}/>
    </>
  );
}
