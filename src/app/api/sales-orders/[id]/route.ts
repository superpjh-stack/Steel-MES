import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  orderedQty: z.number().int().positive().optional(),
  dueDate:    z.string().optional(),
  status:     z.enum(['received', 'confirmed', 'in_production', 'completed', 'cancelled']).optional(),
  notes:      z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const order = await prisma.salesOrder.findUnique({
    where: { id: params.id },
    include: {
      customer:  true,
      product:   true,
      createdBy: { select: { name: true } },
    },
  });

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['supervisor', 'manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: any = { ...parsed.data };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);

  const order = await prisma.salesOrder.update({
    where: { id: params.id },
    data,
    include: {
      customer: { select: { name: true } },
      product:  { select: { name: true } },
    },
  });

  return NextResponse.json(order);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const order = await prisma.salesOrder.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!['received', 'cancelled'].includes(order.status)) {
    return NextResponse.json({ error: '진행 중인 수주는 삭제할 수 없습니다' }, { status: 409 });
  }

  await prisma.salesOrder.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
