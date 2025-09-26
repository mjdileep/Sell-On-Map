import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

function requireAdmin(session: any) {
  const isAdmin = Boolean(session?.user?.isAdmin);
  if (!isAdmin) throw new Error('forbidden');
}

export async function GET(request: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { requireAdmin(session); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get('status') || 'all').toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  const now = new Date();
  let where: any = {};
  if (status === 'active') where = { ...where, isActive: true, expiresAt: { gt: now } };
  else if (status === 'inactive') where = { ...where, isActive: false };
  else if (status === 'pending') where = { ...where, moderationStatus: 'PENDING' as any };
  else if (status === 'rejected') where = { ...where, moderationStatus: 'REJECTED' as any };
  else if (status === 'approved') where = { ...where, moderationStatus: 'APPROVED' as any };

  // Additional filters
  const q = (searchParams.get('q') || '').trim();
  if (q) {
    where = {
      ...where,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ],
    };
  }
  const userEmail = (searchParams.get('userEmail') || '').trim();
  if (userEmail) {
    where = { ...where, user: { is: { email: { equals: userEmail, mode: 'insensitive' } } } };
  }
  const userId = (searchParams.get('userId') || '').trim();
  if (userId) {
    where = { ...where, userId };
  }
  const category = (searchParams.get('category') || '').trim();
  if (category) {
    where = { ...where, category: { startsWith: category } };
  }
  const currency = (searchParams.get('currency') || '').trim();
  if (currency) {
    where = { ...where, currency };
  }
  const minPriceRaw = searchParams.get('minPrice');
  const maxPriceRaw = searchParams.get('maxPrice');
  if (minPriceRaw || maxPriceRaw) {
    const price: any = {};
    const minPrice = Number(minPriceRaw);
    const maxPrice = Number(maxPriceRaw);
    if (Number.isFinite(minPrice)) price.gte = Math.round(minPrice);
    if (Number.isFinite(maxPrice)) price.lte = Math.round(maxPrice);
    if (Object.keys(price).length > 0) where = { ...where, price };
  }
  const createdFromRaw = (searchParams.get('createdFrom') || '').trim();
  const createdToRaw = (searchParams.get('createdTo') || '').trim();
  if (createdFromRaw || createdToRaw) {
    const createdAt: any = {};
    const from = createdFromRaw ? new Date(createdFromRaw) : undefined;
    const to = createdToRaw ? new Date(createdToRaw) : undefined;
    if (from && !isNaN(from.getTime())) createdAt.gte = from;
    if (to && !isNaN(to.getTime())) createdAt.lte = to;
    if (Object.keys(createdAt).length > 0) where = { ...where, createdAt };
  }

  const [total, ads] = await Promise.all([
    prisma.ad.count({ where }),
    prisma.ad.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        rentalDetail: true,
        landRentalDetail: true,
        buildingRentalDetail: true,
        landSaleDetail: true,
        buildingSaleDetail: true,
        user: { select: { id: true, email: true, name: true } },
      },
    } as any),
  ]);

  const mapped = (ads as any[]).map((ad) => {
    const details = ad.landRentalDetail?.attributes || ad.buildingRentalDetail?.attributes || ad.rentalDetail?.attributes || ad.landSaleDetail?.attributes || ad.buildingSaleDetail?.attributes || undefined;
    const { rentalDetail, landRentalDetail, buildingRentalDetail, landSaleDetail, buildingSaleDetail, ...rest } = ad;
    return { ...rest, details };
  });

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return NextResponse.json({ ads: mapped, meta: { total, page, pageSize, pageCount } });
}


