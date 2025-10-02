import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { logImpressions } from '@/app/api/ads/utils';
import { computeShortCode } from '@/lib/slug';

function parseCategory(raw?: string | null): string {
  const c = (raw || '').trim().toLowerCase();
  if (!c || c === 'all') return 'all';
  return c.replace(/\s+/g, '').replace(/_/g, '.').replace(/\/+/g, '.').replace(/\.+/g, '.').replace(/\.$/, '');
}

function includesCategory(target: string, leaf: string): boolean {
  if (target === 'all' || !target) return true;
  return leaf === target || leaf.startsWith(target + '.');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius');
  const swLat = searchParams.get('swLat');
  const swLng = searchParams.get('swLng');
  const neLat = searchParams.get('neLat');
  const neLng = searchParams.get('neLng');
  const category = parseCategory(searchParams.get('category'));
  const multiCatsRaw = searchParams.getAll('categories');
  const multiCategories = multiCatsRaw
    .flatMap((v) => (v || '').split(','))
    .map((v) => parseCategory(v))
    .filter((v) => v && v !== 'all');
  const vwRaw = searchParams.get('vw');
  const vhRaw = searchParams.get('vh');
  const kRaw = searchParams.get('k');

  // Only show approved and active ads publicly
  const whereBase: any = { isActive: true, moderationStatus: 'APPROVED' } as any;
  if (Array.isArray(multiCategories) && multiCategories.length > 0) {
    // OR across selected leaf categories
    whereBase.OR = multiCategories.map((c) => ({ category: { startsWith: c } }));
  } else if (category !== 'all') {
    whereBase.category = { startsWith: category };
  }

  let ads;
  if (swLat && swLng && neLat && neLng) {
    const south = parseFloat(swLat); const west = parseFloat(swLng);
    const north = parseFloat(neLat); const east = parseFloat(neLng);
    ads = await prisma.ad.findMany({
      where: {
        ...whereBase,
        lat: { gte: south, lte: north },
        lng: { gte: west, lte: east },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    } as any);
  } else if (lat && lng && radius) {
    // Approximate by bounding box for simplicity; can be replaced with PostGIS later
    const latF = parseFloat(lat), lngF = parseFloat(lng), r = parseFloat(radius);
    const degLat = r / 111; // ~111km per degree
    const degLng = r / (111 * Math.cos((latF * Math.PI) / 180));
    ads = await prisma.ad.findMany({
      where: {
        ...whereBase,
        lat: { gte: latF - degLat, lte: latF + degLat },
        lng: { gte: lngF - degLng, lte: lngF + degLng },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    } as any);
  } else {
    ads = await prisma.ad.findMany({
      where: whereBase,
      orderBy: { createdAt: 'desc' },
      take: 500,
    } as any);
  }
  // Determine how many full markers (K) to show based on viewport size or explicit k
  const vw = vwRaw ? parseInt(vwRaw, 10) : undefined;
  const vh = vhRaw ? parseInt(vhRaw, 10) : undefined;
  let k = kRaw ? parseInt(kRaw, 10) : NaN;
  if (!Number.isFinite(k) || k <= 0) {
    if (vw && vh) {
      const grid = parseInt(process.env.MAP_FULL_MARKER_GRID_PX || '120', 10);
      // Roughly one full marker per grid cell; clamp within reasonable bounds
      k = Math.max(12, Math.min(100, Math.ceil(vw / grid) * Math.ceil(vh / grid)));
    } else {
      k = 50; // Fallback when viewport is unknown
    }
  }
  k = Math.min(k, Array.isArray(ads) ? ads.length : 0);

  // Attach unified details JSON
  const fullList = (ads as any[]).map((a) => ({
    ...a,
    details: (a as any).attributes || undefined,
  }));

  // New listing algorithm:
  // 1) Take a super-sample of size 2N from newest-first list
  // 2) Split into boosted (boost > 1) and normal (boost = 1)
  // 3) Binomial sample (weighted without replacement) each group separately:
  //    - Boosted: weight = boost value
  //    - Normal:  weight = inverse age (1 / (1 + ageHours))
  // 4) Concat boosted-first, then normal
  // 5) Return top N

  function weightedBinomialSample(items: any[], weights: number[], target: number): any[] {
    const n = items.length;
    if (target <= 0 || n === 0) return [];
    if (target >= n) return items.slice();

    // Split positive and zero weights to allow fair fallback
    const pos: Array<{ idx: number; w: number }> = [];
    const zero: number[] = [];
    for (let i = 0; i < n; i++) {
      const w = Number.isFinite(weights[i]) ? Math.max(0, Number(weights[i])) : 0;
      if (w > 0) pos.push({ idx: i, w }); else zero.push(i);
    }

    // Gumbel top-k for positive weights (equivalent to weighted sampling without replacement a.k.a. binomial here)
    function gumbel(): number {
      const u = Math.min(1 - 1e-12, Math.max(1e-12, Math.random()));
      return -Math.log(-Math.log(u));
    }
    const scored = pos.map(({ idx, w }) => ({ idx, key: Math.log(w) + gumbel() }));
    scored.sort((a, b) => b.key - a.key);
    const selectedIdxs: number[] = scored.slice(0, Math.min(target, scored.length)).map((s) => s.idx);

    // If we still need more, fill uniformly at random from zero-weight items
    if (selectedIdxs.length < target && zero.length > 0) {
      // Shuffle zero-weight indices and take the remaining
      for (let i = zero.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = zero[i]; zero[i] = zero[j]; zero[j] = tmp;
      }
      const need = target - selectedIdxs.length;
      selectedIdxs.push(...zero.slice(0, need));
    }

    return selectedIdxs.map((i) => items[i]);
  }

  let finalSelected = fullList;
  if (k > 0 && fullList.length > k) {
    const nowMs = Date.now();

    // Super-sample: top 2k newest
    const superK = Math.min(fullList.length, Math.max(k, Math.min(2 * k, fullList.length)));
    const superSample = fullList.slice(0, superK);

    // Split into boosted (>1) and normal (=1)
    const boostedSample = superSample.filter((a: any) => Number(a?.boost || 1) > 1);
    const normalSample = superSample.filter((a: any) => Math.round(Number(a?.boost || 1)) === 1);

    // Weights
    const boostedWeights = boostedSample.map((a: any) => Math.max(0, Number(a?.boost || 1)));
    const normalWeights = normalSample.map((a: any) => {
      const createdAtMs = new Date(a.createdAt as any).getTime();
      const ageHours = Math.max(0, (nowMs - createdAtMs) / 36e5);
      return 1 / (1 + ageHours);
    });

    // Allocate targets proportionally by total weight (fallback to sizes, then half/half)
    const sumBW = boostedWeights.reduce((s, w) => s + w, 0);
    const sumNW = normalWeights.reduce((s, w) => s + w, 0);
    let kBoost = 0;
    if (sumBW + sumNW > 0) {
      kBoost = Math.round((k * sumBW) / (sumBW + sumNW));
    } else {
      const total = boostedSample.length + normalSample.length;
      kBoost = total > 0 ? Math.round((k * boostedSample.length) / total) : 0;
    }
    kBoost = Math.max(0, Math.min(kBoost, boostedSample.length));
    let kNormal = Math.max(0, k - kBoost);
    if (kNormal > normalSample.length) {
      kNormal = normalSample.length;
      // If normal is capped, try to move remainder to boosted up to its length
      const remaining = Math.max(0, k - (kBoost + kNormal));
      kBoost = Math.max(0, Math.min(boostedSample.length, kBoost + remaining));
    } else if (kBoost + kNormal < k) {
      // If boosted got capped earlier, try to move remainder to normal
      const remaining = Math.max(0, k - (kBoost + kNormal));
      kNormal = Math.max(0, Math.min(normalSample.length, kNormal + remaining));
    }

    const selectedBoosted = weightedBinomialSample(boostedSample, boostedWeights, kBoost);
    const selectedNormal = weightedBinomialSample(normalSample, normalWeights, kNormal);

    finalSelected = selectedBoosted.concat(selectedNormal);
    if (finalSelected.length < Math.min(k, superSample.length)) {
      // Top-up deterministically from remaining super-sample, prioritizing boosted then normal by weight
      const remainingBoosted = boostedSample.filter((a) => !selectedBoosted.includes(a));
      const remainingNormal = normalSample.filter((a) => !selectedNormal.includes(a));
      const rbW = remainingBoosted.map((a: any) => Math.max(0, Number(a?.boost || 1)));
      const rnW = remainingNormal.map((a: any) => {
        const createdAtMs = new Date(a.createdAt as any).getTime();
        const ageHours = Math.max(0, (nowMs - createdAtMs) / 36e5);
        return 1 / (1 + ageHours);
      });
      const rbPairs = remainingBoosted.map((item, i) => ({ item, w: rbW[i] || 0 }));
      const rnPairs = remainingNormal.map((item, i) => ({ item, w: rnW[i] || 0 }));
      rbPairs.sort((a, b) => b.w - a.w);
      rnPairs.sort((a, b) => b.w - a.w);
      for (const p of rbPairs) { if (finalSelected.length >= k) break; finalSelected.push(p.item); }
      for (const p of rnPairs) { if (finalSelected.length >= k) break; finalSelected.push(p.item); }
    }
    // Concat order already boosted-first; finally cap to N
    finalSelected = finalSelected.slice(0, Math.min(k, superSample.length));
  }

  const sanitized = finalSelected.map(({ attributes, ...rest }) => ({ ...rest, markerVariant: 'full' }));
  try {
    const impressionIds = sanitized.map((a:any) => a.id);
    if (impressionIds.length > 0) await logImpressions(impressionIds);
  } catch {}
  return NextResponse.json(sanitized);
}

function normalizeCategory(raw?: string | null): string {
  const c = (raw || '').trim();
  if (!c || c === 'all') return 'all';
  return c.replace(/\s+/g, '').replace(/_/g, '.').replace(/\/+/g, '.').replace(/\.+/g, '.').replace(/\.$/, '');
}

type ValidationResult = { ok: true } | { ok: false; errors: string[] };

function validateAdPayload(payload: any): ValidationResult {
  const requiredBase = ['title', 'description', 'address', 'lat', 'lng', 'category'];
  const errors: string[] = [];
  for (const key of requiredBase) {
    if (payload[key] === undefined || payload[key] === null || String(payload[key]).trim() === '') {
      errors.push(`Missing required field: ${key}`);
    }
  }
  const category = normalizeCategory(payload.category);
  const details = (payload.details && typeof payload.details === 'object') ? payload.details : {};

  function requireDetail(path: string, label?: string) {
    const parts = path.split('.');
    let v: any = details;
    for (const p of parts) v = v?.[p];
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      errors.push(`Missing ${label || path} in details`);
    }
  }

  if (category.startsWith('property.rental.land')) {
    requireDetail('type', 'Type');
    requireDetail('size.value', 'Size value');
    requireDetail('size.unit', 'Size unit');
    // pricePerUnit optional
  } else if (category.startsWith('property.for-sale.land')) {
    requireDetail('type', 'Type');
    requireDetail('size.value', 'Size value');
    requireDetail('size.unit', 'Size unit');
  } else if (category.startsWith('property.rental.building')) {
    requireDetail('type', 'Type');
    requireDetail('floorArea.value', 'Floor area value');
    requireDetail('floorArea.unit', 'Floor area unit');
    if (category.includes('property.rental.building.residential.shared')) {
      requireDetail('rooms.beds', 'Beds (vacant)');
      // Gender preference is required for shared residential rentals
      const pg = String((details as any)?.preferredGender || '').toLowerCase();
      const allowed = ['male', 'female', 'any'];
      if (!pg || !allowed.includes(pg)) {
        errors.push('Missing or invalid Gender (preferredGender)');
      }
    }
  } else if (category.startsWith('property.for-sale.building')) {
    requireDetail('type', 'Type');
    requireDetail('floorArea.value', 'Floor area value');
    requireDetail('floorArea.unit', 'Floor area unit');
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true };
}

export async function POST(request: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, price, currency, address, lat, lng, category, photos, details } = body || {};

  const validation = validateAdPayload(body);
  if (!validation.ok) {
    return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } }) as any;
  const activeDays = Number((user?.adActiveDays as number | undefined) ?? 3);
  const maxActive = Number((user?.maxActiveAds as number | undefined) ?? 1);

  const activeCount = await prisma.ad.count({ where: { userId, isActive: true } });
  const activateNow = false; // New ads always start pending; admin must approve

  const now = new Date();
  const expiresAt = activateNow ? new Date(now.getTime() + activeDays * 24 * 60 * 60 * 1000) : null as any;

  const created = await prisma.ad.create({
    data: {
      title,
      description,
      price: Math.round(Number(price) || 0),
      address,
      currency: String(currency || 'USD'),
      lat: Number(lat),
      lng: Number(lng),
      category: String(category || 'property.rental'),
      photos: Array.isArray(photos) ? photos : [],
      moderationStatus: 'PENDING' as any,
      isActive: false,
      activatedAt: null,
      expiresAt: expiresAt,
      deactivatedAt: now,
      userId,
      attributes: details && typeof details === 'object' ? details : undefined,
    } as any,
  });
  // Compute and persist shortCode if not set
  try {
    const sc = computeShortCode(userId, new Date(created.createdAt as any));
    await prisma.ad.update({ where: { id: created.id }, data: { shortCode: sc } as any } as any);
    (created as any).shortCode = sc;
  } catch {}
  return NextResponse.json(created, { status: 201 });
}


