import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (ad.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if ((ad as any).moderationStatus !== 'APPROVED') {
    return NextResponse.json({ error: 'Ad must be approved by admin before activation' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const maxActive = Number(user?.maxActiveAds ?? 1);
  const activeCount = await prisma.ad.count({ where: { userId, isActive: true } });
  if (activeCount >= maxActive) {
    return NextResponse.json({ error: `Max active ads limit (${maxActive}) reached` }, { status: 400 });
  }

  const days = Number(user?.adActiveDays ?? 3);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const updated = await prisma.ad.update({
    where: { id },
    data: { isActive: true, activatedAt: now, expiresAt, deactivatedAt: null },
  });
  return NextResponse.json(updated);
}


