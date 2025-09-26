import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Idempotent endpoint for scheduled deactivation of expired ads
export async function POST() {
  const now = new Date();
  const result = await prisma.ad.updateMany({
    where: { isActive: true, expiresAt: { lt: now } },
    data: { isActive: false, deactivatedAt: now },
  });
  return NextResponse.json({ deactivated: result.count });
}


