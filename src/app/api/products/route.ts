import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  code:        z.string().min(1),
  name:        z.string().min(1),
  category:    z.string().min(1),
  unit:        z.string().default('EA'),
  customerId:  z.string().uuid(),
  drawingNo:   z.string().optional(),
  stdCycleSec: z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get('search') ?? '';
  const category = searchParams.get('category');
  const page     = parseInt(searchParams.get('page')  ?? '1');
  const limit    = parseInt(searchParams.get('limit') ?? '20');

  const where = {
    ...(search   ? { OR: [{ name: { contains: search } }, { code: { contains: search } }] } : {}),
    ...(category ? { category } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        customer: { select: { name: true, code: true } },
        _count: { select: { workOrders: true, inventory: true } },
      },
      orderBy: { code: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
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

  const product = await prisma.product.create({
    data: parsed.data,
    include: { customer: { select: { name: true } } },
  });

  return NextResponse.json(product, { status: 201 });
}
