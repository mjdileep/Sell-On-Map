import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [user, activeCount, totalCount, categories, lastActiveEvent] = await Promise.all([
    prisma.user.findUnique({ where: { id } }) as any,
    prisma.ad.count({ where: { userId: id, isActive: true } }),
    prisma.ad.count({ where: { userId: id } }),
    prisma.ad.findMany({ where: { userId: id }, select: { category: true }, distinct: ['category'] } as any),
    prisma.analyticsEvent.findFirst({ where: { userId: id }, orderBy: { occurredAt: 'desc' } }),
  ]);

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const joinedDate = new Date(user.createdAt as any);
  const now = new Date();
  const years = joinedDate ? Math.max(0, now.getFullYear() - joinedDate.getFullYear() - ((now.getMonth() < joinedDate.getMonth() || (now.getMonth() === joinedDate.getMonth() && now.getDate() < joinedDate.getDate())) ? 1 : 0)) : 0;
  const specialties = Array.from(new Set((categories || []).map((c: any) => String(c.category || '')))).filter(Boolean);

  return NextResponse.json({
    id: user.id,
    name: user.name,
    image: user.profileImage || user.image || null,
    companyName: user.companyName || null,
    licenseNumber: user.licenseNumber || null,
    registrationNumber: user.registrationNumber || null,
    joinedDate: user.createdAt,
    joinedYears: years,
    activeAds: activeCount,
    totalAds: totalCount,
    specialties,
    lastActiveAt: lastActiveEvent?.occurredAt || user.updatedAt,
  });
}


