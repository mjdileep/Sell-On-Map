"use client";

import type { Rental as Ad } from "@/types/rental";
import { MapPin, Landmark, Maximize2 } from "lucide-react";
import { formatCurrency } from "@/lib/currencyUtils";
import ResponsiveImg from "@/components/ResponsiveImg";

export default function MyListingCard({ ad }: { ad: Ad }) {
  const details: any = (ad as any).details || {};
  const size = details?.size || details?.landSize;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all">
      <div className="flex gap-3 p-3">
        {/* Compact Image */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
          {ad.photos?.[0] ? (
            <ResponsiveImg
              src={ad.photos[0]}
              alt={ad.title}
              className="w-full h-full object-cover rounded-md"
              sizesAttr="128px"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
              <Landmark className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content - Optimized for density */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Title & Price Row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 flex-1">
              {ad.title}
            </h3>
            <div className="text-lg sm:text-xl font-bold text-emerald-600 whitespace-nowrap flex-shrink-0">
              {formatCurrency(ad.price, (ad as any).currency || "USD")}
            </div>
          </div>

          {/* Key Details - Compact Badges */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {details?.type && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                {String(details.type)}
              </span>
            )}
            {size?.value && size?.unit && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-xs font-medium text-emerald-700">
                <Maximize2 className="w-3 h-3" />
                {size.value} {size.unit}
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-gray-600 text-xs sm:text-sm">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{ad.address}</span>
          </div>

          {/* Description - Only on larger screens */}
          <p className="hidden sm:block text-sm text-gray-600 line-clamp-2 leading-snug">
            {ad.description}
          </p>
        </div>
      </div>
    </div>
  );
}


