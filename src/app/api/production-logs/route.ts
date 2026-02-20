import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  workOrderId: z.string().uuid(),
  processId: z.string().uuid(),
  equipmentId: z.string().uuid(),
  lotNo: z.string().min(1),
  plannedQty: z.number().int().positive(),
  goodQty: z.number().int().min(0),
  defectQty: z.number().int().min(0).default(0),
  scrapQty: z.number().int().min(0).default(0),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  cycleTimeSec: z.number().int().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const [log] = await prisma.$transaction([
    prisma.productionLog.create({
      data: {
        ...data,
        operatorId: (session.user as any).id,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      },
    }),
    prisma.workOrder.update({
      where: { id: data.workOrderId },
      data: {
        producedQty: { increment: data.goodQty },
        defectQty: { increment: data.defectQty },
      },
    }),
  ]);

  return NextResponse.json(log, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workOrderId = searchParams.get('workOrderId');
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '50');

  const where = workOrderId ? { workOrderId } : {};

  const items = await prisma.productionLog.findMany({
    where,
    include: {
      operator: { select: { name: true } },
      process: { select: { name: true } },
      equipment: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json(items);
}
