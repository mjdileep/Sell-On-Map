"use client";

import type { Rental as Ad } from "@/types/rental";
import { MapPin, Landmark } from "lucide-react";
import { formatCurrency } from "@/lib/currencyUtils";
import ResponsiveImg from "@/components/ResponsiveImg";

export default function MyListingCard({ ad }: { ad: Ad }) {
  const details: any = (ad as any).details || {};
  const size = details?.size || details?.landSize;

  // Collect all detail items for responsive layout
  const detailItems = [];
  if (details?.type) detailItems.push({ label: "Type", value: String(details.type) });
  if (size && size.value && size.unit) detailItems.push({ label: "Size", value: `${size.value} ${size.unit}` });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4">
        {/* Image Section - Responsive sizing */}
        <div className="sm:col-span-4 lg:col-span-3">
          {ad.photos?.[0] ? (
            <ResponsiveImg
              src={ad.photos[0]}
              alt={ad.title}
              className="w-full aspect-[4/3] sm:aspect-square object-cover rounded-lg"
              sizesAttr="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full aspect-[4/3] sm:aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <Landmark className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="sm:col-span-8 lg:col-span-9 flex flex-col gap-3">
          {/* Header with title, location, and price */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                {ad.title}
              </h3>
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                <span className="text-sm font-medium line-clamp-1">{ad.address}</span>
              </div>
            </div>

            {/* Price Badge - Responsive sizing and positioning */}
            <div className="flex items-center text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1 sm:px-3 sm:py-2 self-start sm:self-center">
              <Landmark className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="text-sm sm:text-lg font-bold">
                {formatCurrency(ad.price, (ad as any).currency || "USD")}
              </span>
            </div>
          </div>

          {/* Details Section - Responsive grid */}
          {detailItems.length > 0 && (
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
              {detailItems.map((item, index) => (
                <div key={index} className="text-sm text-gray-700">
                  <span className="text-gray-500 text-xs sm:text-sm">{item.label}:</span>
                  <span className="ml-1 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed line-clamp-3">
            {ad.description}
          </p>
        </div>
      </div>
    </div>
  );
}


