import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

function requireAdmin(session: any) { if (!session?.user?.isAdmin) throw new Error('forbidden'); }

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { requireAdmin(session); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  const { id } = await params;

  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if ((ad as any).moderationStatus !== 'APPROVED') {
    return NextResponse.json({ error: 'Ad must be approved first' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: ad.userId } });
  const maxActive = Number(user?.maxActiveAds ?? 1);
  const activeCount = await prisma.ad.count({ where: { userId: ad.userId, isActive: true } });
  if (activeCount >= maxActive) return NextResponse.json({ error: `User reached limit ${maxActive}` }, { status: 400 });

  const days = Number(user?.adActiveDays ?? 3);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const updated = await prisma.ad.update({ where: { id }, data: { isActive: true, activatedAt: now, expiresAt, deactivatedAt: null } });
  return NextResponse.json(updated);
}


