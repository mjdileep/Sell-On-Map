"use client";

import Link from 'next/link';
import { slugify } from '@/lib/slug';
import { DollarSign, MapPin } from 'lucide-react';
import type { Rental } from '@/types/rental';

interface VisibleRentalsProps {
  rentals: Rental[];
  variant?: 'global' | 'panel';
  onSelect?: (rental: Rental) => void;
}

function RentalCard({ rental, onSelect }: { rental: Rental, onSelect?: (rental: Rental) => void }) {
  const CardInner = (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out overflow-hidden w-full">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate">{rental.title}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-center space-x-1 text-blue-600 font-bold">
            <DollarSign className="h-4 w-4" />
            <span>{rental.price}/mo</span>
          </span>
          <span className="flex items-center space-x-1 text-sm text-gray-500 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{rental.address}</span>
          </span>
        </div>
      </div>
    </div>
  );
  if (onSelect) {
    return (
      <button key={rental.id} onClick={() => onSelect(rental)} className="w-full text-left">
        {CardInner}
      </button>
    );
  }
  const slug = slugify(rental.title);
  return (
    <Link href={`/ad/${rental.id}/${slug}`} key={rental.id}>
      {CardInner}
    </Link>
  );
}

export default function VisibleRentals({ rentals, variant = 'global', onSelect }: VisibleRentalsProps) {
  if (rentals.length === 0) {
    return null;
  }

  return (
    <>
      {variant === 'global' && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4 md:hidden">
          <div className="flex w-sm space-x-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100">
            {rentals.map(rental => <div className="min-w-[260px]" key={rental.id}><RentalCard rental={rental} onSelect={onSelect} /></div>)}
          </div>
        </div>
      )}

      {variant === 'panel' && (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-2">
            {rentals.map(rental => <RentalCard key={rental.id} rental={rental} onSelect={onSelect} />)}
          </div>
        </div>
      )}
    </>
  );
}
