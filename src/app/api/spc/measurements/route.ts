import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  workOrderId:    z.string().uuid(),
  processId:      z.string().uuid(),
  equipmentId:    z.string().uuid().optional(),
  characteristic: z.string().min(1),
  usl:            z.number(),
  lsl:            z.number(),
  nominal:        z.number(),
  measuredValue:  z.number(),
  measuredAt:     z.string().datetime(),
  subgroupNo:     z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['qc', 'me', 'supervisor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const measurement = await prisma.spcMeasurement.create({
    data: {
      ...parsed.data,
      operatorId: (session.user as any).id,
      measuredAt: new Date(parsed.data.measuredAt),
    },
  });

  return NextResponse.json(measurement, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workOrderId    = searchParams.get('workOrderId');
  const characteristic = searchParams.get('characteristic');
  const limit          = parseInt(searchParams.get('limit') ?? '100');

  const items = await prisma.spcMeasurement.findMany({
    where: {
      ...(workOrderId    ? { workOrderId }    : {}),
      ...(characteristic ? { characteristic } : {}),
    },
    orderBy: [{ subgroupNo: 'asc' }, { measuredAt: 'asc' }],
    take: limit,
  });

  return NextResponse.json(items);
}
