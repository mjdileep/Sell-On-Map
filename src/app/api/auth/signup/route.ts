import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
  const { email, password, name } = await request.json();
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
  const hashed = await hash(password, 10);
  const defaultAdActiveDays = Number(process.env.AD_ACTIVE_DAYS || 3);
  const defaultMaxActiveAds = Number(process.env.MAX_ACTIVE_ADS_PER_USER || 1);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      adActiveDays: defaultAdActiveDays,
      maxActiveAds: defaultMaxActiveAds,
    },
  });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
}
