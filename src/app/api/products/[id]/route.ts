import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  name:        z.string().min(1).optional(),
  category:    z.string().min(1).optional(),
  unit:        z.string().optional(),
  drawingNo:   z.string().optional(),
  stdCycleSec: z.number().int().positive().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: { ...parsed.data, updatedAt: new Date() },
    include: { customer: { select: { name: true } } },
  });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['manager', 'admin'].includes((session.user as any).role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { customer: { select: { name: true, code: true } }, processes: true },
  });

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(product);
}
