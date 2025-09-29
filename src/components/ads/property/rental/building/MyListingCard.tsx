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
          <div className="flex items-center text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
            <Home className="w-4 h-4 mr-1" />
            <span className="text-lg font-bold">{formatCurrency(ad.price, (ad as any).currency || "USD")}{isShared ? '/person/mo' : '/mo'}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm text-gray-700">
          {details?.rooms?.bedrooms && (
            <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {details.rooms.bedrooms} bd</div>
          )}
          {details?.rooms?.bathrooms && (
            <div className="flex items-center gap-1"><Bath className="w-4 h-4" /> {details.rooms.bathrooms} ba</div>
          )}
          {typeof details?.rooms?.beds === 'number' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {details.rooms.beds} beds</div>
              {isShared && (
                <div className="flex items-center gap-1">
                  <button disabled={saving} onClick={() => adjustBeds(-1)} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50" aria-label="Decrease beds"><Minus className="w-3 h-3" /></button>
                  <button disabled={saving} onClick={() => adjustBeds(1)} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50" aria-label="Increase beds"><Plus className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          )}
          {fa && fa.value && fa.unit && (
            <div>{fa.value} {fa.unit}</div>
          )}
        </div>
        <p className="text-gray-700 leading-relaxed line-clamp-3">{ad.description}</p>
      </div>
    </div>
  );
}


