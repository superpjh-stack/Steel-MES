import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  equipmentId:    z.string().uuid(),
  logDate:        z.string(),
  shift:          z.enum(['1st', '2nd', '3rd']),
  plannedTimeMin: z.number().int().positive(),
  actualTimeMin:  z.number().int().min(0),
  breakdownMin:   z.number().int().min(0).default(0),
  setupMin:       z.number().int().min(0).default(0),
  plannedQty:     z.number().int().min(0),
  actualQty:      z.number().int().min(0),
  goodQty:        z.number().int().min(0),
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

  const log = await prisma.equipmentLog.create({
    data: {
      ...parsed.data,
      logDate: new Date(parsed.data.logDate),
    },
  });

  return NextResponse.json(log, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const equipmentId = searchParams.get('equipmentId');
  const limit       = parseInt(searchParams.get('limit') ?? '30');

  const items = await prisma.equipmentLog.findMany({
    where: equipmentId ? { equipmentId } : {},
    orderBy: [{ logDate: 'desc' }, { shift: 'asc' }],
    take: limit,
  });

  return NextResponse.json(items);
}
