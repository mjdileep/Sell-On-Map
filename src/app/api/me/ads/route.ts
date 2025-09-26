import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get('status') || 'all').toLowerCase();
  const includeMeta = ['1', 'true', 'yes'].includes((searchParams.get('meta') || '').toLowerCase());
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
  const now = new Date();
  let where: any = { userId };
  if (status === 'active') where = { ...where, isActive: true, expiresAt: { gt: now } };
  else if (status === 'inactive') where = { ...where, isActive: false };
  else if (status === 'pending') where = { ...where, moderationStatus: 'PENDING' as any };
  else if (status === 'rejected') where = { ...where, moderationStatus: 'REJECTED' as any };

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
      },
    } as any),
  ]);

  // Attach unified details JSON onto each ad and strip raw relations
  let adsWithDetails = (ads as any[]).map((ad) => {
    const details =
      ad.landRentalDetail?.attributes ||
      ad.buildingRentalDetail?.attributes ||
      ad.rentalDetail?.attributes ||
      ad.landSaleDetail?.attributes ||
      ad.buildingSaleDetail?.attributes ||
      undefined;

    const { rentalDetail, landRentalDetail, buildingRentalDetail, landSaleDetail, buildingSaleDetail, ...rest } = ad;
    return { ...rest, details };
  });

  if (includeMeta) {
    const [activeCount, user] = await Promise.all([
      prisma.ad.count({ where: { userId, isActive: true } }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);
    const maxActive = Number(user?.maxActiveAds ?? 1);
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    return NextResponse.json({ ads: adsWithDetails, meta: { activeCount, maxActive, total, page, pageSize, pageCount } });
  }
  return NextResponse.json(adsWithDetails);
}


