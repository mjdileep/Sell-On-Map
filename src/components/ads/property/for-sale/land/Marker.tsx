"use client";

import type { Rental as Ad } from "@/types/rental";
import { formatCurrency } from "@/lib/currencyUtils";
import { pricePerPerch } from "@/lib/area";

export function createSaleLandMarkerElement(ad: Ad, markerVariant: 'full' | 'dot'): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "ml-category-marker";
  el.style.cssText =
    "background:#059669;color:#fff;border-radius:9999px;padding:6px 10px;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.2);cursor:pointer;";
  if (markerVariant === 'full') {
    const cur = (ad as any).currency || 'USD';
    const details: any = (ad as any).details || {};
    const size = details?.size;
    const ppp = (size && size.value && size.unit)
      ? pricePerPerch(Number(ad.price), Number(size.value), String(size.unit) as any)
      : null;
    el.textContent = ppp ? `${formatCurrency(ppp, cur)} / perch` : `${formatCurrency(ad.price, cur)}`;
  }
  return el as HTMLDivElement;
}

function make(elColor: string, text?: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'ml-category-marker';
  el.style.cssText = `background:${elColor};color:#fff;border-radius:9999px;padding:6px 10px;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.2);cursor:pointer;`;
  if (text) el.textContent = text;
  return el as HTMLDivElement;
}

export function createSaleLandResidentialMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement {
  const cur = (ad as any).currency || 'USD';
  let text: string | undefined;
  if (variant === 'full') {
    const details: any = (ad as any).details || {};
    const size = details?.size;
    const ppp = (size && size.value && size.unit)
      ? pricePerPerch(Number(ad.price), Number(size.value), String(size.unit) as any)
      : null;
    text = ppp ? `${formatCurrency(ppp, cur)}/perch` : `${formatCurrency(ad.price, cur)}`;
  }
  return make('#10b981', text);
}
export function createSaleLandCommercialMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement {
  const cur = (ad as any).currency || 'USD';
  let text: string | undefined;
  if (variant === 'full') {
    const details: any = (ad as any).details || {};
    const size = details?.size;
    const ppp = (size && size.value && size.unit)
      ? pricePerPerch(Number(ad.price), Number(size.value), String(size.unit) as any)
      : null;
    text = ppp ? `${formatCurrency(ppp, cur)}/perch` : `${formatCurrency(ad.price, cur)}`;
  }
  return make('#059669', text);
}
export function createSaleLandIndustrialMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement {
  const cur = (ad as any).currency || 'USD';
  let text: string | undefined;
  if (variant === 'full') {
    const details: any = (ad as any).details || {};
    const size = details?.size;
    const ppp = (size && size.value && size.unit)
      ? pricePerPerch(Number(ad.price), Number(size.value), String(size.unit) as any)
      : null;
    text = ppp ? `${formatCurrency(ppp, cur)}/perch` : `${formatCurrency(ad.price, cur)}`;
  }
  return make('#047857', text);
}
export function createSaleLandAgriculturalMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement {
  const cur = (ad as any).currency || 'USD';
  let text: string | undefined;
  if (variant === 'full') {
    const details: any = (ad as any).details || {};
    const size = details?.size;
    const ppp = (size && size.value && size.unit)
      ? pricePerPerch(Number(ad.price), Number(size.value), String(size.unit) as any)
      : null;
    text = ppp ? `${formatCurrency(ppp, cur)}/perch` : `${formatCurrency(ad.price, cur)}`;
  }
  return make('#16a34a', text);
}

