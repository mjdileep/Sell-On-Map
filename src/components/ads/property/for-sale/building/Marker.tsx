"use client";

import type { Rental as Ad } from "@/types/rental";
import { formatCurrency } from "@/lib/currencyUtils";

export function createSaleBuildingMarkerElement(ad: Ad, markerVariant: 'full' | 'dot'): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "ml-category-marker";
  el.style.cssText =
    "background:#7c3aed;color:#fff;border-radius:9999px;padding:6px 10px;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.2);cursor:pointer;";
  if (markerVariant === 'full') {
    const cur = (ad as any).currency || 'USD';
    el.textContent = `${formatCurrency(ad.price, cur)}`;
  }
  return el as HTMLDivElement;
}

function mk(color: string, text?: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'ml-category-marker';
  el.style.cssText = `background:${color};color:#fff;border-radius:9999px;padding:6px 10px;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.2);cursor:pointer;`;
  if (text) el.textContent = text;
  return el as HTMLDivElement;
}

// Residential leaves
export function createSaleBuildingResidentialSingleFamilyMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { const cur=(ad as any).currency||'USD'; return mk('#6d28d9', variant === 'full' ? `${formatCurrency(ad.price, cur)}` : undefined); }
export function createSaleBuildingResidentialMultiFamilyMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { const cur=(ad as any).currency||'USD'; return mk('#5b21b6', variant === 'full' ? `${formatCurrency(ad.price, cur)}` : undefined); }
export function createSaleBuildingResidentialCondoTownhouseMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { const cur=(ad as any).currency||'USD'; return mk('#4c1d95', variant === 'full' ? `${formatCurrency(ad.price, cur)}` : undefined); }

// Commercial leaves
export function createSaleBuildingCommercialOfficeMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { const cur=(ad as any).currency||'USD'; return mk('#7c3aed', variant === 'full' ? `${formatCurrency(ad.price, cur)}` : undefined); }
export function createSaleBuildingCommercialRetailMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { const cur=(ad as any).currency||'USD'; return mk('#8b5cf6', variant === 'full' ? `${formatCurrency(ad.price, cur)}` : undefined); }

// Industrial leaves
export function createSaleBuildingIndustrialWarehouseMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { const cur=(ad as any).currency||'USD'; return mk('#6d28d9', variant === 'full' ? `${formatCurrency(ad.price, cur)}` : undefined); }
export function createSaleBuildingIndustrialManufacturingMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { const cur=(ad as any).currency||'USD'; return mk('#5b21b6', variant === 'full' ? `${formatCurrency(ad.price, cur)}` : undefined); }

// Others
export function createSaleBuildingMixedUseMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { const cur=(ad as any).currency||'USD'; return mk('#7c3aed', variant === 'full' ? `${formatCurrency(ad.price, cur)}` : undefined); }
export function createSaleBuildingHospitalityMarkerElement(ad: Ad, variant: 'full' | 'dot'): HTMLDivElement { const cur=(ad as any).currency||'USD'; return mk('#8b5cf6', variant === 'full' ? `${formatCurrency(ad.price, cur)}` : undefined); }


