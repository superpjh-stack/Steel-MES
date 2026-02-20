import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateSoNo } from '@/lib/services/sequence.service';

const createSchema = z.object({
  customerId: z.string().uuid(),
  productId:  z.string().uuid(),
  orderedQty: z.number().int().positive(),
  dueDate:    z.string(),
  notes:      z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status     = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const q          = searchParams.get('q');
  const page       = parseInt(searchParams.get('page')  ?? '1');
  const limit      = parseInt(searchParams.get('limit') ?? '20');

  const where: any = {};
  if (status)     where.status     = status;
  if (customerId) where.customerId = customerId;
  if (q)          where.soNo       = { contains: q };

  const [items, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      include: {
        customer:  { select: { name: true, code: true } },
        product:   { select: { name: true, code: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.salesOrder.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['supervisor', 'manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const soNo = await generateSoNo();
  const order = await prisma.salesOrder.create({
    data: {
      ...parsed.data,
      soNo,
      dueDate:    new Date(parsed.data.dueDate),
      createdById: (session.user as any).id,
    },
    include: {
      customer: { select: { name: true } },
      product:  { select: { name: true } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
