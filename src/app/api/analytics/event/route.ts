import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const eventType = String(json?.eventType || '').trim();
    if (!eventType) return NextResponse.json({ ok: false }, { status: 200 });

    const h = await headers();
    const countryHeader = h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || null;

    const data: any = {
      eventType,
      adId: json?.adId ? String(json.adId) : null,
      path: json?.path ? String(json.path) : req.nextUrl.pathname,
      referrer: json?.referrer ? String(json.referrer) : null,
      country: json?.country ? String(json.country) : countryHeader,
      clientId: json?.clientId ? String(json.clientId) : null,
      metadata: json?.metadata || null,
    };

    await prisma.analyticsEvent.create({ data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}


