import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

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
  const vwRaw = searchParams.get('vw');
  const vhRaw = searchParams.get('vh');
  const kRaw = searchParams.get('k');

  // Only show approved and active ads publicly
  const whereBase: any = { isActive: true, moderationStatus: 'APPROVED' } as any;
  if (category !== 'all') whereBase.category = { startsWith: category };

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
      include: {
        rentalDetail: true,
        landRentalDetail: true,
        buildingRentalDetail: true,
        landSaleDetail: true,
        buildingSaleDetail: true,
      },
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
      include: {
        rentalDetail: true,
        landRentalDetail: true,
        buildingRentalDetail: true,
        landSaleDetail: true,
        buildingSaleDetail: true,
      },
    } as any);
  } else {
    ads = await prisma.ad.findMany({
      where: whereBase,
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        rentalDetail: true,
        landRentalDetail: true,
        buildingRentalDetail: true,
        landSaleDetail: true,
        buildingSaleDetail: true,
      },
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

  // Attach unified details JSON onto each ad
  let adsWithVariant = (ads as any[]).map((a) => ({
    ...a,
    details:
      a.landRentalDetail?.attributes ||
      a.buildingRentalDetail?.attributes ||
      a.rentalDetail?.attributes ||
      a.landSaleDetail?.attributes ||
      a.buildingSaleDetail?.attributes ||
      undefined,
  }));
  if (k > 0 && adsWithVariant.length > 0) {
    const selected = new Set<number>();
    while (selected.size < k) {
      selected.add(Math.floor(Math.random() * adsWithVariant.length));
    }
    adsWithVariant = adsWithVariant.map((ad, idx) => ({
      ...ad,
      markerVariant: selected.has(idx) ? 'full' : 'dot',
    }));
  }
  // Strip raw relations before returning
  const sanitized = adsWithVariant.map(({ rentalDetail, landRentalDetail, buildingRentalDetail, landSaleDetail, buildingSaleDetail, ...rest }) => rest);
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

  const created = await prisma.$transaction(async (tx) => {
    const trx = tx as any;
    const ad = await tx.ad.create({
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
      } as any,
    });
    const cat: string = ad.category;
    const attrs = details && typeof details === 'object' ? details : undefined;
    if (cat.startsWith('property.rental.land.')) {
      await trx.landRentalDetail.create({ data: { adId: ad.id, attributes: attrs as any } });
    } else if (cat.startsWith('property.rental.building.')) {
      await trx.buildingRentalDetail.create({ data: { adId: ad.id, attributes: attrs as any } });
    } else if (cat === 'property.rental' || cat.startsWith('property.rental.')) {
      await trx.rentalDetail.create({ data: { adId: ad.id, attributes: attrs as any } });
    } else if (cat === 'property.for-sale.land' || cat.startsWith('property.for-sale.land.')) {
      await trx.landSaleDetail.create({ data: { adId: ad.id, attributes: attrs as any } });
    } else if (cat === 'property.for-sale.building' || cat.startsWith('property.for-sale.building.')) {
      await trx.buildingSaleDetail.create({ data: { adId: ad.id, attributes: attrs as any } });
    } else if (cat === 'clothing' || cat.startsWith('clothing.')) {
      await trx.clothingDetail.create({ data: { adId: ad.id, attributes: attrs as any } });
    }
    return ad;
  });
  return NextResponse.json(created, { status: 201 });
}


