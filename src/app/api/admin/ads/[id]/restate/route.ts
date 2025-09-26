import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

function requireAdmin(session: any) { if (!session?.user?.isAdmin) throw new Error('forbidden'); }

// Restate: move REJECTED -> PENDING so it can be reviewed again
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { requireAdmin(session); } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  const { id } = await params;
  const updated = await prisma.ad.update({ where: { id }, data: { moderationStatus: 'PENDING' as any, rejectReason: null } });
  return NextResponse.json(updated);
}


