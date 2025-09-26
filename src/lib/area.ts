// Simple area conversion helpers centered on the Perch as the base unit.

export type AreaUnit = 'perch' | 'acre' | 'hect' | 'sqft' | 'sqm';

// Conversion factors to one perch
// References (common in Sri Lanka):
// - 1 acre = 160 perches
// - 1 hectare ≈ 2.47105381 acres → 2.47105381 * 160 ≈ 395.3686096 perches
// - 1 perch = 272.25 square feet
// - 1 square meter ≈ 10.7639104167 square feet
const PERCHES_PER_UNIT: Record<AreaUnit, number> = {
  perch: 1,
  acre: 160,
  hect: 160 * 2.47105381,
  sqft: 1 / 272.25,
  sqm: (10.7639104167 as number) / 272.25,
};

export function convertToPerches(value: number, unit: AreaUnit): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const factor = PERCHES_PER_UNIT[unit];
  return value * factor;
}

export function pricePerPerch(totalPrice: number, value: number, unit: AreaUnit): number | null {
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) return null;
  const perches = convertToPerches(value, unit);
  if (!Number.isFinite(perches) || perches <= 0) return null;
  return totalPrice / perches;
}


