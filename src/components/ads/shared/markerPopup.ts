"use client";

import type { Rental as Ad } from "@/types/rental";
import { formatCurrency } from "@/lib/currencyUtils";
import { pricePerPerch } from "@/lib/area";
import { unitNames } from "@/lib/unitNames";

function createEl<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, textContent?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent != null) el.textContent = textContent;
  return el as HTMLElementTagNameMap[K];
}

function truncate(text: string | undefined | null, max: number): string {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, Math.max(0, max - 1)) + "…";
}

function isRentalCategory(category?: string | null): boolean {
  const c = String(category || "").toLowerCase();
  return c === "property.rental" || c.startsWith("property.rental.");
}

function isSaleCategory(category?: string | null): boolean {
  const c = String(category || "").toLowerCase();
  return c === "property.for-sale" || c.startsWith("property.for-sale.");
}

function isLandCategory(category?: string | null): boolean {
  const c = String(category || "").toLowerCase();
  return c.includes(".land");
}

function isBuildingCategory(category?: string | null): boolean {
  const c = String(category || "").toLowerCase();
  return c.includes(".building");
}

function metricParts(ad: Ad): string[] {
  const details: any = (ad as any).details || {};
  const parts: string[] = [];

  if (isBuildingCategory(ad.category)) {
    const type = String(details?.type || "").toLowerCase();
    const rooms = details?.rooms || {};
    const structure = details?.structure || {};
    const fa = details?.floorArea;
    const ls = details?.landSize;

    if (type === "residential") {
      if (rooms?.bedrooms) parts.push(`${rooms.bedrooms} Bedroom${rooms.bedrooms > 1 ? 's' : ''}`);
      if (rooms?.bathrooms) parts.push(`${rooms.bathrooms} Bathroom${rooms.bathrooms > 1 ? 's' : ''}`);
    }
    if (fa && fa.value && fa.unit) parts.push(`${fa.value} ${unitNames[fa.unit as keyof typeof unitNames] || fa.unit}`);
    if (structure?.floors) parts.push(`${structure.floors} Floor${structure.floors > 1 ? 's' : ''}`);
    if (!fa && ls && ls.value && ls.unit) parts.push(`${ls.value} ${unitNames[ls.unit as keyof typeof unitNames] || ls.unit}`);
  } else if (isLandCategory(ad.category)) {
    const size = details?.size;
    if (size && size.value && size.unit) parts.push(`${size.value} ${unitNames[size.unit as keyof typeof unitNames] || size.unit}`);

    // Add price per perch for sale land if derivable
    if (isSaleCategory(ad.category) && size && size.value && size.unit) {
      try {
        const ppp = pricePerPerch(Number(ad.price), Number(size.value), String(size.unit) as any);
        const cur = (ad as any).currency || 'USD';
        if (ppp && isFinite(ppp)) parts.push(`${formatCurrency(ppp, cur)}/perch`);
      } catch {}
    }
  }

  return parts;
}

function priceText(ad: Ad): string {
  const cur = (ad as any).currency || 'USD';
  const category = String((ad as any).category || '').toLowerCase();
  const isRental = isRentalCategory(category);
  const details: any = (ad as any).details || {};
  const suffix = isRental ? `/${details?.billingPeriod || 'mo'}` : '';
  return `${formatCurrency(Number(ad.price), cur)}${suffix}`;
}

function priceColorClass(ad: Ad): string {
  const c = String((ad as any).category || '').toLowerCase();
  if (isRentalCategory(c)) return 'text-blue-700';
  if (c.includes('for-sale.land')) return 'text-emerald-700';
  return 'text-indigo-700';
}

export function createMarkerPopupContent(ad: Ad, markerVariant: 'full' | 'dot' = 'full'): HTMLDivElement {
  const container = createEl('div', 'ml-popup p-2 max-w-[280px]');

  const row = createEl('div', 'flex items-start gap-2');
  container.appendChild(row);

  const thumbnailUrl = (ad as any).photos?.[0];
  if (thumbnailUrl) {
    const thumbWrap = createEl('div', 'flex-shrink-0');
    const img = createEl('img', 'w-14 h-14 object-cover rounded-md border');
    img.setAttribute('src', String(thumbnailUrl));
    img.setAttribute('alt', truncate(ad.title, 40));
    thumbWrap.appendChild(img);
    row.appendChild(thumbWrap);
  }

  const right = createEl('div', 'flex-1 min-w-0');
  row.appendChild(right);

  const priceEl = createEl('div', `text-[12px] font-bold ${priceColorClass(ad)}`, priceText(ad));
  right.appendChild(priceEl);

  const metrics = metricParts(ad);
  if (metrics.length > 0) {
    const metricsEl = createEl('div', 'text-[11px] text-gray-600 truncate whitespace-pre-line');
    metricsEl.textContent = metrics.join('\n');
    right.appendChild(metricsEl);
  }

  return container as HTMLDivElement;
}


