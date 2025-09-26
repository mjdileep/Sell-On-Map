"use client";

import type { Rental as Ad } from "@/types/rental";
import { formatCurrency } from "@/lib/currencyUtils";

function mk(color: string, text?: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'ml-category-marker';
  el.style.cssText = `background:${color};color:#fff;border-radius:9999px;padding:6px 10px;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.2);cursor:pointer;`;
  if (text) el.textContent = text;
  return el as HTMLDivElement;
}

function label(ad: Ad): string { return `${formatCurrency(ad.price, (ad as any).currency || 'USD')}/mo`; }
export function createRentalLandCommercialMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { return mk('#0ea5e9', variant === 'full' ? label(ad) : undefined); }
export function createRentalLandIndustrialMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { return mk('#0284c7', variant === 'full' ? label(ad) : undefined); }
export function createRentalLandAgriculturalMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { return mk('#0369a1', variant === 'full' ? label(ad) : undefined); }


