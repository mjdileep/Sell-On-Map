import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

function requireAdmin(session: any) {
  const isAdmin = Boolean(session?.user?.isAdmin);
  if (!isAdmin) throw new Error('forbidden');
}

export async function POST(request: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    requireAdmin(session);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { adId } = await request.json();
  if (!adId) return NextResponse.json({ error: 'adId required' }, { status: 400 });

  const ad = await prisma.ad.findUnique({ where: { id: adId } });
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Enforce max active per user
  const user = await prisma.user.findUnique({ where: { id: ad.userId } });
  const maxActive = Number(user?.maxActiveAds ?? 1);
  const activeCount = await prisma.ad.count({ where: { userId: ad.userId, isActive: true } });
  if (activeCount >= maxActive) {
    return NextResponse.json({ error: `User already has ${activeCount}/${maxActive} active ads` }, { status: 400 });
  }

  // Activate now and set expiry from activation time
  const days = Number(user?.adActiveDays ?? 3);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const updated = await prisma.ad.update({
    where: { id: adId },
    data: {
      moderationStatus: 'APPROVED' as any,
      rejectReason: null,
      isActive: true,
      activatedAt: now,
      expiresAt,
      deactivatedAt: null,
    },
  });

  return NextResponse.json(updated);
}


