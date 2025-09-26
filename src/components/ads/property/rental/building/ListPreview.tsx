"use client";

import { DollarSign, MapPin } from "lucide-react";
import type { Rental } from "@/types/rental";
import { formatCurrency } from "@/lib/currencyUtils";
import ResponsiveImg from "@/components/ResponsiveImg";

export interface RentalListPreviewProps {
  rentals: Rental[];
  onSelect: (rental: Rental) => void;
}

export default function RentalListPreview({ rentals, onSelect }: RentalListPreviewProps) {
  if (!rentals || rentals.length === 0) return null;

  return (
    <div className="space-y-2">
      {rentals.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r)}
          className="w-full text-left bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
        >
          {r.photos?.[0] ? (
            <ResponsiveImg src={r.photos[0]} alt={r.title} className="w-full h-28 object-cover" sizesAttr="(max-width: 768px) 80vw, 320px" />
          ) : null}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 truncate">{r.title}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="flex items-center space-x-1 text-blue-600 font-bold">
                <DollarSign className="h-4 w-4" />
                <span>{formatCurrency(r.price, (r as any).currency || 'USD')}/mo</span>
              </span>
              <span className="flex items-center space-x-1 text-sm text-gray-500 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{r.address}</span>
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}


