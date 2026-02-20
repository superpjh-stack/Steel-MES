import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  name:      z.string().min(1).optional(),
  contact:   z.string().optional(),
  otdTarget: z.number().min(0).max(100).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role;
  if (!['manager', 'admin'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const customer = await prisma.customer.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(customer);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.customer.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
