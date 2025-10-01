import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session?.user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    let boost = Math.round(Number(body?.boost));
    if (!Number.isFinite(boost)) boost = 1;
    boost = Math.max(1, Math.min(100, boost));
    const updated = await prisma.ad.update({ where: { id }, data: { boost } });
    return NextResponse.json({ ok: true, ad: updated });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}


