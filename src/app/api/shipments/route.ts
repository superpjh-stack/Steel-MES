import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { format } from 'date-fns';

const createSchema = z.object({
  customerId:  z.string().uuid(),
  workOrderId: z.string().uuid(),
  productId:   z.string().uuid(),
  lotNo:       z.string().optional(),
  shippedQty:  z.number().int().positive(),
  plannedDate: z.string(),
});

async function generateShipmentNo(): Promise<string> {
  const prefix = `SHP-${format(new Date(), 'yyyyMMdd')}`;
  const count  = await prisma.shipment.count({ where: { shipmentNo: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status     = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const page       = parseInt(searchParams.get('page')  ?? '1');
  const limit      = parseInt(searchParams.get('limit') ?? '20');

  const where = {
    ...(status     ? { status: status as any } : {}),
    ...(customerId ? { customerId }             : {}),
  };

  const [items, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: {
        customer:  { select: { name: true, code: true } },
        workOrder: { select: { woNo: true } },
        product:   { select: { name: true, code: true } },
      },
      orderBy: { plannedDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shipment.count({ where }),
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

  const shipmentNo = await generateShipmentNo();
  const shipment = await prisma.shipment.create({
    data: {
      ...parsed.data,
      shipmentNo,
      plannedDate: new Date(parsed.data.plannedDate),
      createdById: (session.user as any).id,
    },
    include: {
      customer: { select: { name: true } },
      product:  { select: { name: true } },
    },
  });

  return NextResponse.json(shipment, { status: 201 });
}
