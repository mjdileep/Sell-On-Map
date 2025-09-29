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
  try {
    requireAdmin(session);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  const [total, ads] = await Promise.all([
    prisma.ad.count({ where: { moderationStatus: 'PENDING' as any } }),
    prisma.ad.findMany({
      where: { moderationStatus: 'PENDING' as any },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { id: true, email: true, name: true } } },
    } as any),
  ]);

  const mapped = (ads as any[]).map((ad) => {
    const { attributes, ...rest } = ad as any;
    return { ...rest, details: attributes || undefined };
  });

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return NextResponse.json({ ads: mapped, meta: { total, page, pageSize, pageCount } });
}


