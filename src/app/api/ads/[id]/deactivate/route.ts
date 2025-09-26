import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id as string | undefined;
  const isAdmin = Boolean(session?.user?.isAdmin);
  if (!userId && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!isAdmin && ad.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const now = new Date();
  const updated = await prisma.ad.update({ where: { id }, data: { isActive: false, deactivatedAt: now } });
  return NextResponse.json(updated);
}


