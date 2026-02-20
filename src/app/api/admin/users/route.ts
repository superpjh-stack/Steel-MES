import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createSchema = z.object({
  email:      z.string().email(),
  name:       z.string().min(1),
  password:   z.string().min(4),
  role:       z.enum(['admin','manager','supervisor','operator','qc','viewer']),
  department: z.string().optional(),
  shift:      z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: { id: true, email: true, name: true, role: true, department: true, shift: true, isActive: true, lastLoginAt: true },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { password, ...rest } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { ...rest, passwordHash },
    select: { id: true, email: true, name: true, role: true, department: true, shift: true, isActive: true },
  });
  return NextResponse.json(user, { status: 201 });
}
