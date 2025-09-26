"use client";

import type { Rental as Ad } from "@/types/rental";
import { formatCurrency } from "@/lib/currencyUtils";

export function createClothingMarkerElement(ad: Ad, markerVariant: 'full' | 'dot'): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "ml-category-marker";
  el.style.cssText =
    "background:#111827;color:#fff;border-radius:9999px;padding:6px 10px;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.2);cursor:pointer;";
  
  if (markerVariant === 'full') {
    el.textContent = `${formatCurrency(ad.price, (ad as any).currency || 'USD')}`;
  }
  return el as HTMLDivElement;
}

