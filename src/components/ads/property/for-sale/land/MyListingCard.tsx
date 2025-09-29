"use client";

import type { Rental as Ad } from "@/types/rental";
import { MapPin, Landmark } from "lucide-react";
import { formatCurrency } from "@/lib/currencyUtils";
import ResponsiveImg from "@/components/ResponsiveImg";

export default function MyListingCard({ ad }: { ad: Ad }) {
  const details: any = (ad as any).details || {};
  const size = details?.size || details?.landSize;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="sm:col-span-1">
        {ad.photos?.[0] ? (
          <ResponsiveImg
            src={ad.photos[0]}
            alt={ad.title}
            className="w-full h-40 object-cover rounded-lg"
            sizesAttr="(max-width: 768px) 100vw, 320px"
          />
        ) : null}
      </div>
      <div className="sm:col-span-2 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{ad.title}</h3>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
              <span className="truncate text-sm font-medium">{ad.address}</span>
            </div>
          </div>
          <div className="flex items-center text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
            <Landmark className="w-4 h-4 mr-1" />
            <span className="text-lg font-bold">{formatCurrency(ad.price, (ad as any).currency || "USD")}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
          {details?.type && (
            <div>
              <span className="text-gray-500">Type:</span> {String(details.type)}
            </div>
          )}
          {size && size.value && size.unit && (
            <div>
              <span className="text-gray-500">Size:</span> {size.value} {size.unit}
            </div>
          )}
        </div>
        <p className="text-gray-700 leading-relaxed line-clamp-3">{ad.description}</p>
      </div>
    </div>
  );
}


