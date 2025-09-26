"use client";

import { MapPin } from "lucide-react";
import MapPicker from "@/components/MapPicker";

export interface LocationFieldsProps {
  address: string;
  onAddressChange: (v: string) => void;
  location: { lat: number; lng: number } | null;
  onLocationChange: (v: { lat: number; lng: number }) => void;
  label?: string;
  placeholder?: string;
  overideZoom?: number | null;
  editMode?: boolean;
}

export default function LocationFields({ address, onAddressChange, location = null, onLocationChange, label = "Address", placeholder = "Enter address", overideZoom = null, editMode = false }: LocationFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={address} onChange={(e) => onAddressChange(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder={placeholder} required />
        </div>
      </div>
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <MapPicker value={location} onChange={onLocationChange} overideZoom={overideZoom} editMode={editMode} />
      </div>
    </div>
  );
}


