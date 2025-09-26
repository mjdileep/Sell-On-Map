import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

function requireAdmin(session: any) { if (!session?.user?.isAdmin) throw new Error('forbidden'); }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { requireAdmin(session); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  const { id } = await params;
  const { reason } = await request.json().catch(() => ({ reason: '' }));
  const updated = await prisma.ad.update({ where: { id }, data: { moderationStatus: 'REJECTED' as any, rejectReason: String(reason || '').slice(0, 500), isActive: false, deactivatedAt: new Date() } });
  return NextResponse.json(updated);
}


