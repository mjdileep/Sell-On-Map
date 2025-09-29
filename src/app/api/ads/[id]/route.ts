import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
 
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ad = await prisma.ad.findUnique({
    where: { id },
  } as any);
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Public read should only expose approved+active ads
  if (!(ad as any).isActive || (ad as any).moderationStatus !== 'APPROVED') {
    const session = (await getServerSession(authOptions as any)) as any;
    const isAdmin = Boolean(session?.user?.isAdmin);
    const userId = session?.user?.id as string | undefined;
    // Allow owners and admins to view their own/non-public ads
    if (!isAdmin && (ad as any).userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }
  const { attributes, ...rest } = ad as any;
  return NextResponse.json({ ...rest, details: attributes || undefined });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id as string | undefined;
  const isAdmin = Boolean(session?.user?.isAdmin);
  if (!userId && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const payload = await request.json();
  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!isAdmin && ad.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const updated = await prisma.$transaction(async (tx) => {
    const trx = tx as any;
    const data: any = {};
    if (payload.title !== undefined) data.title = String(payload.title);
    if (payload.description !== undefined) data.description = String(payload.description);
    if (payload.price !== undefined) data.price = Math.round(Number(payload.price));
    if (payload.address !== undefined) data.address = String(payload.address);
    if (payload.lat !== undefined) data.lat = Number(payload.lat);
    if (payload.lng !== undefined) data.lng = Number(payload.lng);
    if (payload.currency !== undefined) data.currency = String(payload.currency);
    if (payload.category !== undefined) data.category = String(payload.category);
    if (payload.details && typeof payload.details === 'object') data.attributes = payload.details;
    if (Array.isArray(payload.photos)) data.photos = payload.photos.map((p: any) => String(p));
    const details = payload.details && typeof payload.details === 'object' ? payload.details : undefined;
    const prevCategory = ad.category;
    const nextCategory = data.category ?? prevCategory;

    // Update the ad first
    const updatedAd = await tx.ad.update({ where: { id }, data });

    // Attributes are now embedded; no leaf-table operations
    return updatedAd;
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id as string | undefined;
  const isAdmin = Boolean(session?.user?.isAdmin);
  if (!userId && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!isAdmin && ad.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await prisma.ad.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


