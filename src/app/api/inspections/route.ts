import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  type: z.enum(['incoming', 'in_process', 'outgoing']),
  workOrderId: z.string().uuid(),
  lotNo: z.string().min(1),
  processId: z.string().uuid().optional(),
  sampleQty: z.number().int().positive(),
  passQty: z.number().int().min(0),
  failQty: z.number().int().min(0),
  result: z.enum(['pass', 'fail', 'conditional']),
  inspectionDate: z.string().datetime(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['qc', 'supervisor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await prisma.inspectionRecord.create({
    data: {
      ...parsed.data,
      inspectorId: (session.user as any).id,
      inspectionDate: new Date(parsed.data.inspectionDate),
    },
  });

  return NextResponse.json(record, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workOrderId = searchParams.get('workOrderId');

  const items = await prisma.inspectionRecord.findMany({
    where: workOrderId ? { workOrderId } : {},
    include: {
      inspector: { select: { name: true } },
      workOrder: { select: { woNo: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(items);
}
