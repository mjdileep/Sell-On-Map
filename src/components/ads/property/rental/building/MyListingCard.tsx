"use client";

import type { Rental as Ad } from "@/types/rental";
import { MapPin, Bed, Bath, Home, Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/currencyUtils";
import ResponsiveImg from "@/components/ResponsiveImg";
import { useState } from "react";

export default function MyListingCard({ ad }: { ad: Ad }) {
  const details: any = (ad as any).details || {};
  const fa = details?.floorArea;
  const cat = String((ad as any).category || '').toLowerCase();
  const isShared = cat.includes('property.rental.building.residential.shared');
  const [saving, setSaving] = useState(false);

  async function adjustBeds(delta: number) {
    if (!isShared) return;
    const currentBeds = Number(details?.rooms?.beds || 0);
    const next = Math.max(0, currentBeds + delta);
    if (next === currentBeds) return;
    setSaving(true);
    try {
      await fetch(`/api/ads/${(ad as any).id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details: { ...(details || {}), rooms: { ...(details?.rooms || {}), beds: next } } })
      });
      (ad as any).details = { ...(details || {}), rooms: { ...(details?.rooms || {}), beds: next } };
    } finally {
      setSaving(false);
    }
  }

  // Collect all detail items for responsive layout
  const detailItems = [];
  if (details?.rooms?.bedrooms) {
    detailItems.push({
      icon: <Bed className="w-4 h-4" />,
      text: `${details.rooms.bedrooms} bedroom${details.rooms.bedrooms > 1 ? 's' : ''}`,
      action: null
    });
  }
  if (details?.rooms?.bathrooms) {
    detailItems.push({
      icon: <Bath className="w-4 h-4" />,
      text: `${details.rooms.bathrooms} bathroom${details.rooms.bathrooms > 1 ? 's' : ''}`,
      action: null
    });
  }
  if (typeof details?.rooms?.beds === 'number') {
    detailItems.push({
      icon: <Bed className="w-4 h-4" />,
      text: `${details.rooms.beds} beds`,
      action: isShared ? (
        <div className="flex items-center gap-1 ml-2">
          <button disabled={saving} onClick={() => adjustBeds(-1)} className="px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50" aria-label="Decrease beds">
            <Minus className="w-3 h-3" />
          </button>
          <button disabled={saving} onClick={() => adjustBeds(1)} className="px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50" aria-label="Increase beds">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      ) : null
    });
  }
  if (fa && fa.value && fa.unit) {
    detailItems.push({
      icon: null,
      text: `${fa.value} ${fa.unit}`,
      action: null
    });
  }

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
              <Home className="w-8 h-8 text-gray-400" />
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
            <div className="flex items-center text-blue-700 bg-blue-50 rounded-lg px-2 py-1 sm:px-3 sm:py-2 self-start sm:self-center">
              <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="text-sm sm:text-lg font-bold">
                {formatCurrency(ad.price, (ad as any).currency || "USD")}
                {isShared ? '/person/mo' : '/mo'}
              </span>
            </div>
          </div>

          {/* Details Section - Responsive layout */}
          {detailItems.length > 0 && (
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {detailItems.map((item, index) => (
                <div key={index} className="flex items-center text-sm text-gray-700">
                  {item.icon && <span className="mr-1 flex-shrink-0">{item.icon}</span>}
                  <span className="font-medium">{item.text}</span>
                  {item.action && <span className="ml-1">{item.action}</span>}
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


