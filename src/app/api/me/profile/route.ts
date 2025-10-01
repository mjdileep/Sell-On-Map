import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } }) as any;
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { password, ...safe } = user;
  return NextResponse.json({
    id: safe.id,
    name: safe.name,
    image: safe.profileImage || safe.image || null,
    companyName: safe.companyName || null,
    licenseNumber: safe.licenseNumber || null,
    registrationNumber: safe.registrationNumber || null,
    createdAt: safe.createdAt,
  });
}

export async function PUT(request: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const data: any = {};
  if (body.name !== undefined) data.name = String(body.name || '').slice(0, 120) || null;
  if (body.companyName !== undefined) data.companyName = String(body.companyName || '').slice(0, 200) || null;
  if (body.licenseNumber !== undefined) data.licenseNumber = String(body.licenseNumber || '').slice(0, 100) || null;
  if (body.registrationNumber !== undefined) data.registrationNumber = String(body.registrationNumber || '').slice(0, 100) || null;
  if (body.image !== undefined) data.profileImage = String(body.image || '').slice(0, 1000) || null;

  const updated = await prisma.user.update({ where: { id: userId }, data }) as any;
  const { password, ...safe } = updated;
  return NextResponse.json({
    id: safe.id,
    name: safe.name,
    image: safe.profileImage || safe.image || null,
    companyName: safe.companyName || null,
    licenseNumber: safe.licenseNumber || null,
    registrationNumber: safe.registrationNumber || null,
    createdAt: safe.createdAt,
  });
}


