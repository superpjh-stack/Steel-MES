import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  defectCode:       z.string().min(1).optional(),
  defectName:       z.string().min(1).optional(),
  qty:              z.number().int().positive().optional(),
  disposition:      z.enum(['rework', 'scrap', 'use_as_is', 'return']).optional(),
  rootCause:        z.string().optional(),
  correctiveAction: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['qc', 'supervisor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const defect = await prisma.defectLog.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(defect);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.defectLog.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
