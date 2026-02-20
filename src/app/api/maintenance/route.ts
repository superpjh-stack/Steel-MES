import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  equipmentId:  z.string().uuid(),
  type:         z.enum(['preventive', 'corrective', 'emergency']),
  description:  z.string().min(1),
  startTime:    z.string().datetime(),
  endTime:      z.string().datetime().optional(),
  partsUsed:    z.array(z.object({ partName: z.string(), qty: z.number(), cost: z.number() })).optional(),
  cost:         z.number().min(0).optional(),
  nextPmDate:   z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['me', 'supervisor', 'manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await prisma.maintenanceRecord.create({
    data: {
      equipmentId:  parsed.data.equipmentId,
      type:         parsed.data.type,
      description:  parsed.data.description,
      technicianId: (session.user as any).id,
      startTime:    new Date(parsed.data.startTime),
      endTime:      parsed.data.endTime ? new Date(parsed.data.endTime) : undefined,
      partsUsed:    parsed.data.partsUsed ? JSON.stringify(parsed.data.partsUsed) : undefined,
      cost:         parsed.data.cost,
      nextPmDate:   parsed.data.nextPmDate ? new Date(parsed.data.nextPmDate) : undefined,
    },
    include: {
      equipment:  { select: { name: true, code: true } },
      technician: { select: { name: true } },
    },
  });

  // PM 완료 시 설비의 lastPmDate 업데이트
  if (parsed.data.type === 'preventive' && parsed.data.nextPmDate) {
    await prisma.equipment.update({
      where: { id: parsed.data.equipmentId },
      data: {
        lastPmDate: new Date(parsed.data.startTime),
      },
    });
  }

  return NextResponse.json(record, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const equipmentId = searchParams.get('equipmentId');
  const type        = searchParams.get('type');
  const page        = parseInt(searchParams.get('page')  ?? '1');
  const limit       = parseInt(searchParams.get('limit') ?? '20');

  const where = {
    ...(equipmentId ? { equipmentId } : {}),
    ...(type        ? { type }        : {}),
  };

  const [items, total] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      where,
      include: {
        equipment:  { select: { name: true, code: true } },
        technician: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.maintenanceRecord.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}
