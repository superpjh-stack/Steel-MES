import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  inventoryId:  z.string().uuid(),
  movementType: z.enum(['receipt', 'issue', 'return', 'adjustment', 'shipment']),
  qty:          z.number().refine((v) => v !== 0, 'qty cannot be zero'),
  workOrderId:  z.string().uuid().optional(),
  referenceNo:  z.string().optional(),
});

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

  const { inventoryId, movementType, qty, workOrderId, referenceNo } = parsed.data;

  const [movement] = await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: {
        inventoryId,
        movementType,
        qty,
        workOrderId,
        referenceNo,
        createdById: (session.user as { id: string }).id,
      },
    }),
    prisma.inventory.update({
      where: { id: inventoryId },
      data: { qty: { increment: qty } },
    }),
  ]);

  return NextResponse.json(movement, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const inventoryId = searchParams.get('inventoryId');
  const page  = parseInt(searchParams.get('page')  ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '30');

  const where = inventoryId ? { inventoryId } : {};

  const [items, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}
