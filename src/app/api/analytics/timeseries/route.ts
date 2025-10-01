import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const country = url.searchParams.get('country');
    const adId = url.searchParams.get('adId');
    const granularity = (url.searchParams.get('granularity') || 'day').toLowerCase(); // 'hour' | 'day'

    // If adId present: allow the ad owner or admin
    if (adId) {
      const ad = await prisma.ad.findUnique({ where: { id: adId }, select: { id: true, userId: true } });
      const isOwner = !!(session?.user?.id && ad?.userId === session.user.id);
      const isAdmin = !!session?.user?.isAdmin;
      if (!isOwner && !isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    } else {
      // No adId: admin-only aggregate view
      if (!session?.user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const wherePV: any = {};
    if (from) wherePV.occurredAt = { gte: new Date(from) };
    if (to) wherePV.occurredAt = { ...(wherePV.occurredAt || {}), lte: new Date(to) };
    if (country) wherePV.country = country;
    if (adId) wherePV.path = { contains: adId } as any; // rarely used for pageviews

    const whereEV: any = {};
    if (from) whereEV.occurredAt = { gte: new Date(from) };
    if (to) whereEV.occurredAt = { ...(whereEV.occurredAt || {}), lte: new Date(to) };
    if (country) whereEV.country = country;
    if (adId) whereEV.adId = adId;

    const [pageviews, events] = await Promise.all([
      prisma.pageView.findMany({ where: wherePV, select: { occurredAt: true } }),
      prisma.analyticsEvent.findMany({ where: whereEV, select: { occurredAt: true, eventType: true } }),
    ]);

    function truncate(d: Date): string {
      const date = new Date(d);
      if (granularity === 'hour') {
        date.setMinutes(0, 0, 0);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return date.toISOString();
    }

    const pvBuckets = new Map<string, number>();
    for (const p of pageviews) {
      const key = truncate(p.occurredAt);
      pvBuckets.set(key, (pvBuckets.get(key) || 0) + 1);
    }

    const evBuckets = new Map<string, { impression: number; view: number; click: number }>();
    for (const e of events) {
      const key = truncate(e.occurredAt);
      const bucket = evBuckets.get(key) || { impression: 0, view: 0, click: 0 };
      const type = (e.eventType || '').toLowerCase();
      if (type === 'impression') bucket.impression += 1;
      else if (type === 'ad_view') bucket.view += 1;
      else if (type === 'ad_click') bucket.click += 1;
      else bucket.view += 1;
      evBuckets.set(key, bucket);
    }

    const keys = Array.from(new Set([...pvBuckets.keys(), ...evBuckets.keys()])).sort();
    const pvSeries = keys.map((k) => ({ t: k, v: pvBuckets.get(k) || 0 }));
    const impressions = keys.map((k) => ({ t: k, v: evBuckets.get(k)?.impression || 0 }));
    const views = keys.map((k) => ({ t: k, v: evBuckets.get(k)?.view || 0 }));
    const clicks = keys.map((k) => ({ t: k, v: evBuckets.get(k)?.click || 0 }));

    return NextResponse.json({ pvSeries, impressions, views, clicks });
  } catch (e) {
    return NextResponse.json({ pvSeries: [], impressions: [], views: [], clicks: [] });
  }
}


