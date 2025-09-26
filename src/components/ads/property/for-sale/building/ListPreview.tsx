"use client";

import { MapPin, Building2 } from "lucide-react";
import type { Rental as Ad } from "@/types/rental";
import { formatCurrency } from "@/lib/currencyUtils";
import ResponsiveImg from "@/components/ResponsiveImg";

export interface BuildingListPreviewProps {
  ads: Ad[];
  onSelect: (ad: Ad) => void;
  variant?: 'global' | 'panel';
}

function Card({ ad, onSelect }: { ad: Ad; onSelect: (ad: Ad) => void }) {
  return (
    <button onClick={() => onSelect(ad)} className="w-full text-left">
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out overflow-hidden w-full">
        {ad.photos?.[0] ? (
          <ResponsiveImg src={ad.photos[0]} alt={ad.title} className="w-full h-28 object-cover" sizesAttr="(max-width: 768px) 80vw, 320px" />
        ) : null}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{ad.title}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center space-x-1 text-indigo-700 font-bold">
              <Building2 className="h-4 w-4" />
              <span>{formatCurrency(ad.price, (ad as any).currency || 'USD')}</span>
            </span>
            <span className="flex items-center space-x-1 text-sm text-gray-500 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{ad.address}</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function BuildingListPreview({ ads, onSelect, variant = 'global' }: BuildingListPreviewProps) {
  if (!ads || ads.length === 0) return null;
  if (variant === 'panel') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-2">
          {ads.map((ad) => <Card key={ad.id} ad={ad} onSelect={onSelect} />)}
        </div>
      </div>
    );
  }
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4 md:hidden">
      <div className="flex w-sm space-x-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100">
        {ads.map((ad) => (
          <div className="min-w-[260px]" key={ad.id}>
            <Card ad={ad} onSelect={onSelect} />
          </div>
        ))}
      </div>
    </div>
  );
}


