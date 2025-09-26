import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
  const { email, password, name } = await request.json();
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
  const hashed = await hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed, name } });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
}
