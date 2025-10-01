import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

function dateTrunc(unit: 'hour' | 'day', tz: string | null): string {
  // postgres date_trunc('day', occurredAt)
  return `date_trunc('${unit}', "occurredAt")`;
}

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const country = url.searchParams.get('country');
    const path = url.searchParams.get('path');
    const eventType = url.searchParams.get('eventType');

    const wherePV: any = {};
    if (from) wherePV.occurredAt = { gte: new Date(from) };
    if (to) wherePV.occurredAt = { ...(wherePV.occurredAt || {}), lte: new Date(to) };
    if (country) wherePV.country = country;
    if (path) wherePV.path = path;

    const whereEV: any = {};
    if (from) whereEV.occurredAt = { gte: new Date(from) };
    if (to) whereEV.occurredAt = { ...(whereEV.occurredAt || {}), lte: new Date(to) };
    if (country) whereEV.country = country;
    if (eventType) whereEV.eventType = eventType;

    const [pvCount, evCount, rawTopPaths, rawTopCountries, rawEventsByType] = await Promise.all([
      prisma.pageView.count({ where: wherePV }),
      prisma.analyticsEvent.count({ where: whereEV }),
      prisma.pageView.groupBy({ by: ['path'], _count: { path: true }, where: wherePV, orderBy: { _count: { path: 'desc' } }, take: 10 }),
      prisma.pageView.groupBy({ by: ['country'], _count: { country: true }, where: wherePV, orderBy: { _count: { country: 'desc' } }, take: 10 }),
      prisma.analyticsEvent.groupBy({ by: ['eventType'], _count: { eventType: true }, where: whereEV, orderBy: { _count: { eventType: 'desc' } }, take: 20 }),
    ]);

    // Map counts to _count._all to match UI expectations
    const topPaths = rawTopPaths.map((r: any) => ({ path: r.path, _count: { _all: r._count?.path || 0 } }));
    const topCountries = rawTopCountries.map((r: any) => ({ country: r.country, _count: { _all: r._count?.country || 0 } }));
    const eventsByType = rawEventsByType.map((r: any) => ({ eventType: r.eventType, _count: { _all: r._count?.eventType || 0 } }));

    return NextResponse.json({ pvCount, evCount, topPaths, topCountries, eventsByType });
  } catch (e) {
    return NextResponse.json({ pvCount: 0, evCount: 0, topPaths: [], topCountries: [], eventsByType: [] });
  }
}


