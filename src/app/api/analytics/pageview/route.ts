import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  try {
    let h = 0;
    for (let i = 0; i < ip.length; i++) {
      h = ((h << 5) - h) + ip.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const h = await headers();
    const ua = req.headers.get('user-agent');
    const countryHeader = h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || null;
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || null;
    const ipHash = hashIp(ip);

    const data: any = {
      path: json?.path ? String(json.path) : req.nextUrl.pathname,
      referrer: json?.referrer ? String(json.referrer) : null,
      country: json?.country ? String(json.country) : countryHeader,
      clientId: json?.clientId ? String(json.clientId) : null,
      hostname: json?.hostname || null,
      userAgent: String(json?.userAgent || ua || ''),
      screen: json?.screen || null,
      ipHash,
    };
    await prisma.pageView.create({ data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}


