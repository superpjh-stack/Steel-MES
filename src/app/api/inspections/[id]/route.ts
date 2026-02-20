import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  type:           z.enum(['incoming', 'in_process', 'outgoing']).optional(),
  lotNo:          z.string().min(1).optional(),
  sampleQty:      z.number().int().positive().optional(),
  passQty:        z.number().int().min(0).optional(),
  failQty:        z.number().int().min(0).optional(),
  result:         z.enum(['pass', 'fail', 'conditional']).optional(),
  inspectionDate: z.string().datetime().optional(),
  notes:          z.string().optional(),
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

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.inspectionDate) {
    data.inspectionDate = new Date(parsed.data.inspectionDate);
  }

  const record = await prisma.inspectionRecord.update({
    where: { id: params.id },
    data,
    include: {
      inspector: { select: { name: true } },
      workOrder: { select: { woNo: true } },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.inspectionRecord.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
