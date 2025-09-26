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

  const { adId, reason } = await request.json();
  if (!adId) return NextResponse.json({ error: 'adId required' }, { status: 400 });
  const updated = await prisma.ad.update({
    where: { id: adId },
    data: {
      moderationStatus: 'REJECTED' as any,
      rejectReason: String(reason || '').slice(0, 500) || 'Rejected by admin',
      isActive: false,
      deactivatedAt: new Date(),
    },
  });
  return NextResponse.json(updated);
}


