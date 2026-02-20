import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  name:         z.string().min(1).optional(),
  unit:         z.string().optional(),
  spec:         z.string().optional(),
  supplier:     z.string().optional(),
  safetyStock:  z.number().min(0).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['manager', 'admin'].includes((session.user as any).role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const material = await prisma.material.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(material);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['manager', 'admin'].includes((session.user as any).role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.material.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
