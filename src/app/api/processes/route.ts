import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  code:        z.string().min(1),
  name:        z.string().min(1),
  seq:         z.number().int().positive(),
  productId:   z.string().uuid().optional(),
  equipmentId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  const items = await prisma.process.findMany({
    where: productId ? { productId } : {},
    include: {
      product:   { select: { name: true, code: true } },
      equipment: { select: { name: true, code: true } },
    },
    orderBy: { seq: 'asc' },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const process = await prisma.process.create({
    data: parsed.data,
    include: {
      product:   { select: { name: true } },
      equipment: { select: { name: true } },
    },
  });

  return NextResponse.json(process, { status: 201 });
}
