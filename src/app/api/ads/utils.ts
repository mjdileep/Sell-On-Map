import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function logImpressions(adIds: string[]): Promise<void> {
  if (!Array.isArray(adIds) || adIds.length === 0) return;
  try {
    const h = await headers();
    const country = h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || null;
    const clientId = null; // unknown from server; keep null
    const now = new Date();
    await prisma.analyticsEvent.createMany({
      data: adIds.map((id) => ({ eventType: 'impression', adId: id, country, occurredAt: now })),
    } as any);
  } catch {
    // ignore
  }
}


